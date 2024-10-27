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

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const responseHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Authorization',
			'Content-Type': 'application/json'
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: responseHeaders });
		}

		if (request.headers.get('Authorization') !== `Bearer ${env.AUTHENTICATION_TOKEN}`) {
			return new Response('Unauthorized', { status: 401, headers: responseHeaders });
		}

		const parsedUrl = new URL(request.url);

		const lrcLibFetchOptions = {
			headers: {
				'User-Agent': 'LWKTV/1.0.0 (github.com/cbruegg)'
			}
		};

		if (parsedUrl.pathname.startsWith('/search')) {
			const query = new URL(request.url).searchParams.get('q');

			const searchLyricsResponse = await fetch(`https://lrclib.net/api/search?q=${query}`, lrcLibFetchOptions);
			const searchLyricsData = await searchLyricsResponse.json();
			return new Response(JSON.stringify(searchLyricsData), { headers: responseHeaders });
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
			return new Response(JSON.stringify(await processLyrics(getLyricsData, env.OPENAI_API_TOKEN, options)), { headers: responseHeaders });
		}

		return new Response('Not found', { status: 404, headers: responseHeaders });
	}
} satisfies ExportedHandler<Env>;
