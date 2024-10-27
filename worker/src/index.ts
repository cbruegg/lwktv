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

// TODO Global rate limit
// TODO Convert traditional to simplified Chinese (maybe optionally)
// TODO Add Pinyin
// TODO Add optional translation

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const parsedUrl = new URL(request.url);
		if (parsedUrl.pathname.startsWith('/search')) {
			const query = new URL(request.url).searchParams.get('q');
			const searchLyricsResponse = await fetch(`https://lrclib.net/api/search?q=${query}`);
			const searchLyricsData = await searchLyricsResponse.json();
			return new Response(JSON.stringify(searchLyricsData));
		}
		if (parsedUrl.pathname.startsWith('/lyrics')) {
			const id = parsedUrl.searchParams.get('id');
			const getLyricsResponse = await fetch(`https://lrclib.net/api/get/${id}`);
			const getLyricsData = await getLyricsResponse.json();
			return new Response(JSON.stringify(getLyricsData));
		}

		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
