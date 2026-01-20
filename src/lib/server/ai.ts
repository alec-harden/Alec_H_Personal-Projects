import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { env } from '$env/dynamic/private';

export type AIProvider = 'anthropic' | 'openai';

const provider = (env.AI_PROVIDER || 'anthropic') as AIProvider;

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
