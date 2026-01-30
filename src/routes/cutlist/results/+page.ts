/**
 * Cut List Results Page - Client Load
 *
 * Loads results from navigation state
 */

import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Data comes from navigation state, not server load
	return {};
};
