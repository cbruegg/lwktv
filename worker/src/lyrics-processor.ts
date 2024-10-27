import { LrcLibGetLyricsResponse } from './lrclib-api-types';
import OpenAI from 'openai';
import { GetLyricsResponse } from './api-types';

// TODO Add optional translation

export interface ProcessLyricsOptions {
	traditionalToSimplified?: boolean;
	addPinyin?: boolean;
	addTranslation?: boolean;
}

export async function processLyrics(lrcLibLyrics: LrcLibGetLyricsResponse, openAiApiToken: string, options: ProcessLyricsOptions): Promise<GetLyricsResponse> {
	const { traditionalToSimplified = true, addPinyin = true, addTranslation = false } = options;

	const synced = lrcLibLyrics.syncedLyrics !== undefined && lrcLibLyrics.syncedLyrics !== null;
	const lyrics = lrcLibLyrics.syncedLyrics ?? lrcLibLyrics.plainLyrics;

	console.log({ lyrics });

	const openai = new OpenAI({ apiKey: openAiApiToken });

	let systemInstructions = 'You operate on lyrics. You have the following tasks:\n';
	if (traditionalToSimplified) {
		systemInstructions += '- Translate the user input from traditional Chinese to simplified Chinese. Do not add any comments. Retain timestamps if there are any.\n';
	}
	if (addPinyin) {
		systemInstructions += '- Append transcribed Pinyin to each line of the user input. Place the Pinyin transcription right after the Chinese characters, separating them with \' ~~~ \'. Do not add any comments. Retain timestamps if there are any.\n';
	}
	systemInstructions += 'For example, given the following input:\n';
	systemInstructions += '```\n';
	systemInstructions += '[00:26.92] 明年我計劃去中國和台灣旅行，探索當地的歷史文化和美食。\n' +
		'[00:33.98] 我很期待和家人一起度過一個難忘的假期。\n';
	systemInstructions += '```\n';
	systemInstructions += 'You should output:\n';
	systemInstructions += '```\n';
	if (traditionalToSimplified && addPinyin) {
		systemInstructions += '[00:26.92] 明年我计划去中国和台湾旅行，探索当地的历史文化和美食。míngnián wǒ jìhuà qù zhōngguó hé táiwān lǚxíng, tànsuǒ dāndì de lìshǐ wénhuà hé měishí。\n' +
			'[00:33.98] 我很期待和家人一起度过一个难忘的假期。Wǒ hěn qīdài hé jiārén yīqǐ dùguò yīgè nánwàng de jiàqī。\n';
	} else if (traditionalToSimplified) {
		systemInstructions += '[00:26.92] 明年我计划去中国和台湾旅行，探索当地的历史文化和美食。\n' +
			'[00:33.98] 我很期待和家人一起度过一个难忘的假期。\n';
	} else if (addPinyin) {
		systemInstructions += '[00:26.92] 明年我計劃去中國和台灣旅行，探索當地的歷史文化和美食。míngnián wǒ jìhuà qù zhōngguó hé táiwān lǚxíng, tànsuǒ dāndì de lìshǐ wénhuà hé měishí。\n' +
			'[00:33.98] 我很期待和家人一起度過一個難忘的假期。Wǒ hěn qīdài hé jiārén yīqǐ dùguò yīgè nánwàng de jiàqī';
	}
	systemInstructions += '```\n';

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o',
		messages: [
			{ role: 'system', content: systemInstructions },
			{
				role: 'user',
				content: lyrics
			}
		],
		max_tokens: 4096,
	});
	console.log({ completion });
	const processedLyrics = completion.choices[0].message.content ?? lyrics;

	console.log({ processedLyrics });

	return {
		albumName: lrcLibLyrics.albumName,
		artistName: lrcLibLyrics.artistName,
		duration: lrcLibLyrics.duration,
		id: lrcLibLyrics.id,
		instrumental: false,
		plainLyrics: synced ? stripTimestamps(processedLyrics) : processedLyrics,
		syncedLyrics: synced ? processedLyrics : null,
		trackName: lrcLibLyrics.trackName
	};
}

function stripTimestamps(processedLyrics: string) {
	return processedLyrics.replace(/\[\d+:\d+.\d+]/g, '');
}
