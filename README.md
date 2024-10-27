# 老外KTV

This app displays Chinese song lyrics for people unable to read Chinese well.
It uses GPT-4 to convert traditional to simplified characters and adds pinyin.
Other methods will often mess up the conversion due to polyphonic characters and the lack of a 1:1 mapping between traditional and simplified characters.

The app's main instance is hosted at https://lwktv.pages.dev/.
Unfortunately I cannot make the access token available publicly as song lyrics are protected by copyright.
If you want to use this app, please take a look at the _Hosting_ section.

## Hosting

There are two components:

1. The `worker` directory contains a CloudFlare Worker that fetches lyrics from LRCLI and runs them through GPT-4.
2. The `client-web` directory contains a React app that calls the API and displays results

To deploy the worker, create a CloudFlare account, set up the Wrangler CLI and run `npm run deploy` in the `worker` directory.
Run `wrangler secret put AUTHENTICATION_TOKEN` and set a random password. The client will ask for this password. Use a safe password to protect your API.
Run `wrangler secret put OPENAI_API_TOKEN` and provide an API token for OpenAI. This can be obtained on https://platform.openai.com/.

To deploy the client, replace the API base URL in `client-web/src/api.ts` with your just deployed worker's URL. Then run `npm run build`.
Finally, host the contents of the resulting `client-web/dist` directory anywhere you like. This can be any web server, including GitHub Pages or CloudFlare Pages.
