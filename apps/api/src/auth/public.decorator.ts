import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key read by the AuthGuard.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as reachable without the app password.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
