/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { LrcLibGetLyricsResponse } from './lrclib-api-types';
import { processLyrics, ProcessLyricsOptions } from './lyrics-processor';
import OpenAI from 'openai';
import { SearchLyricsResponse, SearchLyricsResult } from './api-types';
import { sleep } from 'openai/core';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const responseHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Authorization',
			'Cache-Control': 'public, max-age=1209600'
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: responseHeaders });
		}

		const parsedUrl = new URL(request.url);

		if (request.headers.get('Authorization') !== `Bearer ${env.AUTHENTICATION_TOKEN}` && parsedUrl.searchParams.get('token') !== env.AUTHENTICATION_TOKEN) {
			return new Response('Unauthorized', { status: 401, headers: responseHeaders });
		}

		const lrcLibFetchOptions = {
			headers: {
				'User-Agent': 'LWKTV/1.0.0 (github.com/cbruegg)'
			}
		};

		if (parsedUrl.pathname.startsWith('/search')) {
			const query = new URL(request.url).searchParams.get('q') ?? '';
			let resolvedQuery = query;
			console.log({ query });
			if (query.includes('open.spotify.com')) {
				console.log('Spotify URL detected');
				// Make it look like Chrome UA
				const titleResponse = await (await fetch(query, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
					}
				})).text();
				console.log({ titleResponse });
				const titleMatch = titleResponse.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
				if (titleMatch !== null) {
					console.log('Matched title', titleMatch[1]);
					resolvedQuery = titleMatch[1];
				}
			}

			const queryInTraditionalChinese = await convertToTraditionalChinese(resolvedQuery, env.OPENAI_API_TOKEN);
			const searchLyricsResponse = fetch(`https://lrclib.net/api/search?q=${resolvedQuery}`, lrcLibFetchOptions);
			const searchLyricsResponseTraditional = fetch(`https://lrclib.net/api/search?q=${queryInTraditionalChinese}`, lrcLibFetchOptions);
			const searchLyricsData: SearchLyricsResult[] = await (await searchLyricsResponse).json();
			const searchLyricsDataTraditional: SearchLyricsResult[] = await (await searchLyricsResponseTraditional).json();
			const mergedResults = mergeResults(searchLyricsData, searchLyricsDataTraditional);
			const response: SearchLyricsResponse = { resolvedQuery, results: mergedResults };
			return new Response(JSON.stringify(response), { headers: responseHeaders });
		}
		if (parsedUrl.pathname.startsWith('/lyrics')) {
			const id = parsedUrl.pathname.split('/')[2];
			const options: ProcessLyricsOptions = {};
			if (parsedUrl.searchParams.get('traditionalToSimplified') === 'true') {
				options.traditionalToSimplified = true;
			}
			if (parsedUrl.searchParams.get('addPinyin') === 'true') {
				options.addPinyin = true;
			}
			if (parsedUrl.searchParams.get('addTranslation') === 'true') {
				options.addTranslation = true;
			}

			const getLyricsResponse = await fetch(`https://lrclib.net/api/get/${id}`, lrcLibFetchOptions);
			const getLyricsData = await getLyricsResponse.json() as LrcLibGetLyricsResponse;

			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			server.accept();
			server.addEventListener('message', async (event) => {
			});

			const cache = caches.default;
			const cacheKey = new Request(request.url); // Ignore headers
			const cachedResponse = await cache.match(cacheKey);
			console.log({ cacheKey: cacheKey.url, cachedResponse });
			if (cachedResponse !== undefined) {
				const cachedLines = await cachedResponse.text();
				ctx.waitUntil((async () => {
					for (const line of cachedLines.split('\n')) {
						server.send(line);
					}
					server.send('%EOF%');
				})());
			} else {
				ctx.waitUntil((async () => {
					const lines = await processLyrics(server, getLyricsData, env.OPENAI_API_TOKEN, options);
					server.send('%EOF%');
					await cache.put(cacheKey, new Response(lines.join('\n'), { headers: responseHeaders }).clone());
				})());
			}

			return new Response(null, { headers: responseHeaders, status: 101, webSocket: client });
		}

		return new Response('Not found', { status: 404, headers: responseHeaders });
	}
} satisfies ExportedHandler<Env>;

async function convertToTraditionalChinese(text: string, openAiApiToken: string): Promise<string> {
	const openai = new OpenAI({ apiKey: openAiApiToken });

	const systemInstructions = 'You operate on song titles. You have the task to replace any simplified Chinese ' +
		'with traditional Chinese. Do not add any comments. For example, given the following input: \n' +
		'```\n' +
		'工厂\n' +
		'```\n' +
		'You should output:\n' +
		'工廠';

	const conversionCompletion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: systemInstructions },
			{
				role: 'user',
				content: text
			}
		],
		max_tokens: 512
	});
	console.log({ conversionCompletion });
	const processedText = conversionCompletion.choices[0].message.content ?? text;

	console.log({ processedText });

	return processedText.trim();
}

function mergeResults(a: SearchLyricsResult[], b: SearchLyricsResult[]): SearchLyricsResult[] {
	// SearchLyricsResponse is an array of objects that have an ID. Make sure we don't have duplicates.
	const ids = new Set<number>();
	const result: SearchLyricsResult[] = [];
	for (const item of a) {
		if (!ids.has(item.id)) {
			result.push(item);
			ids.add(item.id);
		}
	}
	for (const item of b) {
		if (!ids.has(item.id)) {
			result.push(item);
			ids.add(item.id);
		}
	}
	return result;
}
