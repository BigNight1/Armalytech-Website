// Static prerender of the public routes, run after `vite build`.
//
//  1. Bundles src/entry-server.jsx with Vite's SSR build (same plugins and
//     config as the client build, no extra dependency).
//  2. Renders every public route and injects the markup into #root and the
//     Helmet tags into <head> of the client build's index.html.
//  3. Writes one file per route (dist/precios.html, dist/servicios/x.html,
//     ...), so hosts with "clean URLs" serve it before any SPA fallback.
//
// dist/app-shell.html keeps the pristine, empty SPA shell: it is the fallback
// for every non-prerendered route (admin, tickets, registration, 404), so
// those routes never hydrate against another page's markup.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const ssrOutDir = path.join(root, 'node_modules', '.prerender')

// The routes to prerender are the indexable pages listed in public/sitemap.xml
// (each one must also be a public <Route> in src/App.jsx). Admin, ticket and
// registration routes are intentionally absent: they stay client-rendered.
async function readRoutes() {
  const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
  const routes = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => {
    const { pathname } = new URL(match[1])
    return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  })
  if (routes.length === 0) throw new Error('No <loc> entries found in dist/sitemap.xml')
  return [...new Set(routes)]
}

const SHELL_FILE = 'app-shell.html'

async function bundleServerEntry() {
  await build({
    root,
    logLevel: 'warn',
    // Bundle dependencies instead of loading them through Node's resolver:
    // react-router-dom 7 ships both ESM and CJS builds and Node picks one
    // depending on its version.
    ssr: { noExternal: true },
    build: {
      ssr: path.join(root, 'src', 'entry-server.jsx'),
      outDir: ssrOutDir,
      emptyOutDir: true,
      copyPublicDir: false,
      minify: false,
      rollupOptions: {
        output: { entryFileNames: 'entry-server.mjs', format: 'esm' },
        // Misplaced third-party "/*#__PURE__*/" comments are harmless noise.
        onwarn(warning, defaultHandler) {
          if (warning.code !== 'INVALID_ANNOTATION') defaultHandler(warning)
        },
      },
    },
  })
  return import(pathToFileURL(path.join(ssrOutDir, 'entry-server.mjs')).href)
}

// The template ships a default <title> and static Open Graph tags that pages
// override through Helmet: drop each one the page also provides so every page
// ends with exactly one of each. Tags the page does not set (e.g. the absolute
// og:image) stay.
const TEMPLATE_HEAD_TAG = /<title\b[^>]*>[\s\S]*?<\/title>\s*|<meta\b[^>]*>\s*|<link\b[^>]*>\s*/gi

function headTagKey(tag) {
  if (/^<title\b/i.test(tag)) return 'title'
  if (/^<meta\b/i.test(tag)) {
    if (/\bname\s*=\s*"description"/i.test(tag)) return 'meta:description'
    const property = /\bproperty\s*=\s*"(og:[^"]*)"/i.exec(tag)?.[1]
    return property ? `meta:${property}` : null
  }
  return /\brel\s*=\s*"canonical"/i.test(tag) ? 'link:canonical' : null
}

function stripTemplateTagsProvidedBy(headTags, template) {
  const provided = new Set(
    (headTags.match(TEMPLATE_HEAD_TAG) ?? []).map(headTagKey).filter(Boolean),
  )
  return template.replace(TEMPLATE_HEAD_TAG, (tag) => {
    const key = headTagKey(tag)
    return key && provided.has(key) ? '' : tag
  })
}

function buildHeadTags(helmet) {
  return [
    helmet.title.toString(),
    helmet.priority.toString(),
    helmet.meta.toString(),
    helmet.link.toString(),
    helmet.script.toString(),
    helmet.style.toString(),
  ]
    .filter(Boolean)
    .join('\n    ')
}

function outputFileFor(route) {
  return route === '/' ? 'index.html' : `${route.slice(1)}.html`
}

function injectPage(template, html, helmet) {
  const headTags = buildHeadTags(helmet)
  let page = stripTemplateTagsProvidedBy(headTags, template)
  // Right after <meta charset> so title and description come first in the markup.
  const charset = '<meta charset="UTF-8" />'
  if (!page.includes(charset)) throw new Error(`Template has no ${charset}`)
  page = page.replace(charset, () => `${charset}\n    ${headTags}`)
  const rootOpen = '<div id="root">'
  if (!page.includes(`${rootOpen}</div>`)) throw new Error('Template has no empty <div id="root"></div>')
  page = page.replace(`${rootOpen}</div>`, () => `${rootOpen}${html}</div>`)
  // Helmet marks the attributes it controls on <html>/<body>; keep them.
  const htmlAttrs = helmet.htmlAttributes.toString()
  if (htmlAttrs) page = page.replace(/<html\b/, `<html ${htmlAttrs}`)
  return page
}

function extractTitle(page) {
  return /<title[^>]*>([\s\S]*?)<\/title>/i.exec(page)?.[1]?.trim() ?? '(no title)'
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html is not the pristine SPA shell (did `vite build` run first?)')
  }

  const routes = await readRoutes()
  const { render } = await bundleServerEntry()
  const failures = []
  const pages = []

  for (const route of routes) {
    try {
      const { html, helmet } = render(route)
      if (!html || html.trim().length === 0) throw new Error('empty #root')
      if (!helmet?.title) throw new Error('no Helmet output')
      const page = injectPage(template, html, helmet)
      for (const [label, pattern] of [
        ['<title>', /<title\b/gi],
        ['meta description', /<meta\b[^>]*\bname="description"/gi],
        ['canonical link', /<link\b[^>]*\brel="canonical"/gi],
      ]) {
        const count = (page.match(pattern) ?? []).length
        if (count !== 1) throw new Error(`expected exactly one ${label}, found ${count}`)
      }
      pages.push({ route, page })
    } catch (error) {
      failures.push({ route, error })
    }
  }

  if (failures.length > 0) {
    for (const { route, error } of failures) console.error(`prerender FAILED ${route}: ${error?.stack ?? error}`)
    throw new Error(`${failures.length} route(s) failed to prerender`)
  }

  // Preserve the pristine shell before the home page overwrites index.html.
  await writeFile(path.join(distDir, SHELL_FILE), template)

  for (const { route, page } of pages) {
    const file = path.join(distDir, outputFileFor(route))
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, page)
    const bytes = Buffer.byteLength(page)
    console.log(`prerender ${route.padEnd(42)} ${String(bytes).padStart(7)} B  ${extractTitle(page)}`)
  }
  console.log(`prerender: ${pages.length} routes written, SPA shell at dist/${SHELL_FILE}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => rm(ssrOutDir, { recursive: true, force: true }))
