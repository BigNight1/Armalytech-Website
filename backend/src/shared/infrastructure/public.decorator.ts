import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as reachable without a valid admin session.
 * Used by SessionGuard (ADR 0004): everything is protected by default,
 * only routes explicitly tagged `@Public()` (health, login) skip the check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
