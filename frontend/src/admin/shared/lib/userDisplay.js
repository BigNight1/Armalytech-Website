/**
 * The admin API only returns `{ email, role, ... }` for the signed-in user
 * (no display name — see `AuthContext.jsx` / `authApi.me`), but the design's
 * sidebar user block wants a name and initials. Both are derived from the
 * email's local part as a documented stand-in until a real `name` field
 * exists on the admin account.
 */

/** `'jhon.medina@armalytech.com' -> 'Jhon Medina'`, `'karla@...' -> 'Karla'`. */
export function getDisplayName(email) {
  if (!email) return '';
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

/** `'jhon.medina@armalytech.com' -> 'JM'`, `'karla@...' -> 'KA'`. */
export function getInitials(email) {
  if (!email) return '';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

/** `'owner' -> 'Principal · Owner'`, `'admin' -> 'Personal · Admin'`. */
export function getRoleLabel(role) {
  return role === 'owner' ? 'Principal · Owner' : 'Personal · Admin';
}
