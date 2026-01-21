import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { env } from '$env/dynamic/private';

export type AIProvider = 'anthropic' | 'openai';

const provider = (env.AI_PROVIDER || 'anthropic') as AIProvider;

export function getModel() {
	switch (provider) {
		case 'openai': {
			const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
			return openai('gpt-4o');
		}
		case 'anthropic':
		default: {
			const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
			return anthropic('claude-sonnet-4-20250514');
		}
	}
}

export { provider as currentProvider };
