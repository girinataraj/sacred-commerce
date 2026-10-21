import { createAuthHandlers } from '../../../../lib/server/auth-handlers';
export const runtime = 'nodejs';
export const GET = createAuthHandlers().adminAccess;
