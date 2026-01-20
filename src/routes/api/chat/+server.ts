import { streamText } from 'ai';
import { getModel } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { messages } = await request.json();

	const result = streamText({
		model: getModel(),
		messages,
		system:
			'You are a helpful woodworking assistant that helps users create bills of materials for their projects. Be concise and practical. When discussing materials, be specific about dimensions, quantities, and types.'
	});

	return result.toUIMessageStreamResponse();
};
