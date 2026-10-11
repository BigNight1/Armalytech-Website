# ArmalyTech Website — project rules

## Git: never commit or push unless explicitly asked

- Do NOT run `git commit` or `git push` (nor `git merge`, `git rebase`, `git reset`, `git stash`,
  or any command that creates or rewrites history) unless the user explicitly asks for it in the
  current message.
- This overrides any workflow default (ODD work-unit commits, skills, agent instructions) that
  says to commit after each task. Leave the changes in the working tree and report what changed
  and which files, so the user can review and commit.
- Applies to every sub-agent too: include this rule in every delegation prompt ("do not commit,
  do not push; leave changes uncommitted").
- Read-only git commands (`git status`, `git diff`, `git log`, `git show`) are fine.
- When the user does ask to commit: Conventional Commits, no `Co-Authored-By` or AI attribution.
