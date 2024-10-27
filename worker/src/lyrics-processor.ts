import { LrcLibGetLyricsResponse } from './lrclib-api-types';
import OpenAI from 'openai';

// TODO Add optional translation
// TODO Optimization: Perform processing in a single OpenAI request by giving it multiple instructions + examples.

export interface ProcessLyricsOptions {
	traditionalToSimplified?: boolean;
	addPinyin?: boolean;
	addTranslation?: boolean;
}

export async function processLyrics(lrcLibLyrics: LrcLibGetLyricsResponse, openAiApiToken: string, options: ProcessLyricsOptions): Promise<GetLyricsResponse> {
	const { traditionalToSimplified = true, addPinyin = true, addTranslation = false } = options;

	const synced = lrcLibLyrics.syncedLyrics !== undefined && lrcLibLyrics.syncedLyrics !== null;
	const lyrics = lrcLibLyrics.syncedLyrics ?? lrcLibLyrics.plainLyrics;

	const openai = new OpenAI({ apiKey: openAiApiToken });

	let processedLyrics = lyrics;

	if (traditionalToSimplified) {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{ role: "system", content: "Translate the user input from traditional Chinese to simplified Chinese. Do not add any comments. Retain timestamps if there are any." },
				{
					role: "user",
					content: processedLyrics,
				},
			],
		});
		processedLyrics = completion.choices[0].message.content ?? processedLyrics;
	}

	if (addPinyin) {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{ role: "system", content: "Append transcribed Pinyin to each line of the user input. Place the Pinyin transcription right after the Chinese characters, separating them with ' ~~~ '. Do not add any comments. Retain timestamps if there are any." },
				{
					role: "user",
					content: processedLyrics,
				},
			],
		});
		processedLyrics = completion.choices[0].message.content ?? processedLyrics;
	}

	return {
		albumName: lrcLibLyrics.albumName,
		artistName: lrcLibLyrics.artistName,
		duration: lrcLibLyrics.duration,
		id: lrcLibLyrics.id,
		instrumental: false,
		plainLyrics: synced ? stripTimestamps(processedLyrics) : processedLyrics,
		syncedLyrics: synced ? processedLyrics : null,
		trackName: lrcLibLyrics.trackName,

	};
}

function stripTimestamps(processedLyrics: string) {
	return processedLyrics.replace(/\[\d+:\d+.\d+]/g, '');
}
