import type { PageServerLoad } from './$types';
import { verifyEmailToken, markEmailAsVerified } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { success: false, error: 'Missing verification token' };
	}

	// Validate token
	const userId = await verifyEmailToken(token);

	if (!userId) {
		return {
			success: false,
			error: 'Invalid or expired verification link. Please request a new one.'
		};
	}

	// Mark email as verified and consume token
	await markEmailAsVerified(userId, token);

	return { success: true };
};
