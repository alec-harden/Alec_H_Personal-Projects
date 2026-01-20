import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { AI_PROVIDER } from '$env/static/private';

export type AIProvider = 'anthropic' | 'openai';

const provider = (AI_PROVIDER || 'anthropic') as AIProvider;

export function getModel() {
	switch (provider) {
		case 'openai':
			return openai('gpt-4o');
		case 'anthropic':
		default:
			return anthropic('claude-sonnet-4-20250514');
	}
}

export { provider as currentProvider };
