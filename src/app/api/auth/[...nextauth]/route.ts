/**
 * @fileoverview Route handler de Auth.js.
 * Expone los endpoints GET y POST para /api/auth/*.
 */

import { handlers } from '@/lib/auth/auth';

export const { GET, POST } = handlers;
