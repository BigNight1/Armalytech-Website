import { setServers } from 'node:dns';

/**
 * Optional override for the DNS servers Node uses.
 *
 * Some local machines expose a resolver (e.g. 127.0.0.1) that refuses SRV
 * queries, which breaks `mongodb+srv://` URIs with `querySrv ECONNREFUSED`.
 * Set `DNS_SERVERS=8.8.8.8,1.1.1.1` in `.env` to bypass it. Leave it unset
 * in production.
 */
export function applyDnsServersOverride(value = process.env.DNS_SERVERS) {
  const servers = (value ?? '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    setServers(servers);
  }
}
