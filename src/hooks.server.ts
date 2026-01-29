import { type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Extract session token from cookie
	const sessionToken = event.cookies.get('session_token');

	// 2. Validate session if token exists
	if (sessionToken) {
		// Look up session with user data
		const session = await db.query.sessions.findFirst({
			where: eq(sessions.token, sessionToken),
			with: { user: true }
		});

		if (session) {
			const now = new Date();
			if (session.expiresAt > now) {
				// Check if user account has been disabled
				if (session.user.disabled) {
					// Invalidate session for disabled user
					await db.delete(sessions).where(eq(sessions.id, session.id));
					event.cookies.delete('session_token', { path: '/' });
					// Don't set event.locals.user - treat as logged out
				} else {
					// Valid session - attach user to locals
					event.locals.user = {
						id: session.user.id,
						email: session.user.email,
						role: session.user.role,
						disabled: session.user.disabled,
						createdAt: session.user.createdAt
					};
					event.locals.sessionId = session.id;
				}
			} else {
				// Expired session - clean up
				await db.delete(sessions).where(eq(sessions.id, session.id));
				event.cookies.delete('session_token', { path: '/' });
			}
		} else {
			// Invalid token - clear cookie
			event.cookies.delete('session_token', { path: '/' });
		}
	}

	// 3. Continue to route handler
	return resolve(event);
};
