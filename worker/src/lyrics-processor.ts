import { LrcLibGetLyricsResponse } from './lrclib-api-types';
import OpenAI from 'openai';

export interface ProcessLyricsOptions {
	traditionalToSimplified?: boolean;
	addPinyin?: boolean;
	addTranslation?: boolean;
}

export async function processLyrics(
	recipient: WebSocket,
	lrcLibLyrics: LrcLibGetLyricsResponse,
	openAiApiToken: string,
	options: ProcessLyricsOptions
): Promise<string[]> {
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
	if (addTranslation) {
		systemInstructions += '- Translate the user input from Chinese to English. Do not add any comments. Retain timestamps if there are any.\n';
	}
	systemInstructions += 'For example, given the following input:\n';
	systemInstructions += '```\n';
	systemInstructions += '[00:26.92] 明年我計劃去中國和台灣旅行，探索當地的歷史文化和美食。\n' +
		'[00:33.98] 我很期待和家人一起度過一個難忘的假期。\n';
	systemInstructions += '```\n';
	systemInstructions += 'You should output:\n';
	systemInstructions += '\n';
	if (traditionalToSimplified && addPinyin) {
		systemInstructions += '[00:26.92] 明年我计划去中国和台湾旅行，探索当地的历史文化和美食。 ~~~ míngnián wǒ jìhuà qù zhōngguó hé táiwān lǚxíng, tànsuǒ dāndì de lìshǐ wénhuà hé měishí';
		if (addTranslation) {
			systemInstructions += ' ~~~ Next year I plan to travel to China and Taiwan, exploring the local history, culture, and cuisine.\n';
		} else {
			systemInstructions += '\n';
		}
		systemInstructions += '[00:33.98] 我很期待和家人一起度过一个难忘的假期。 ~~~ Wǒ hěn qīdài hé jiārén yīqǐ dùguò yīgè nánwàng de jiàqī。\n';
		if (addTranslation) {
			systemInstructions += ' ~~~ I\'m looking forward to spending an unforgettable holiday with my family.\n';
		} else {
			systemInstructions += '\n';
		}
	} else if (traditionalToSimplified) {
		systemInstructions += '[00:26.92] 明年我计划去中国和台湾旅行，探索当地的历史文化和美食。';
		if (addTranslation) {
			systemInstructions += ' ~~~ Next year I plan to travel to China and Taiwan, exploring the local history, culture, and cuisine.\n';
		} else {
			systemInstructions += '\n';
		}
		systemInstructions += '[00:33.98] 我很期待和家人一起度过一个难忘的假期。\n';
		if (addTranslation) {
			systemInstructions += ' ~~~ I\'m looking forward to spending an unforgettable holiday with my family.\n';
		} else {
			systemInstructions += '\n';
		}
	} else if (addPinyin) {
		systemInstructions += '[00:26.92] 明年我計劃去中國和台灣旅行，探索當地的歷史文化和美食。~~~ míngnián wǒ jìhuà qù zhōngguó hé táiwān lǚxíng, tànsuǒ dāndì de lìshǐ wénhuà hé měishí';
		if (addTranslation) {
			systemInstructions += ' ~~~ Next year I plan to travel to China and Taiwan, exploring the local history, culture, and cuisine.\n';
		} else {
			systemInstructions += '\n';
		}
		systemInstructions += '[00:33.98] 我很期待和家人一起度過一個難忘的假期。 ~~~ Wǒ hěn qīdài hé jiārén yīqǐ dùguò yīgè nánwàng de jiàqī';
		if (addTranslation) {
			systemInstructions += ' ~~~ I\'m looking forward to spending an unforgettable holiday with my family.\n';
		} else {
			systemInstructions += '\n';
		}
	}
	systemInstructions += '\n';

	const requestStart = Date.now();
	console.log({ openAiRequest: 'lyrics-processing', event: 'request_start', requestStart });
	const completion = await openai.chat.completions.create({
		model: 'gpt-5',
		messages: [
			{ role: 'system', content: systemInstructions },
			{
				role: 'user',
				content: lyrics
			}
		],
		max_completion_tokens: 4096,
		reasoning_effort: 'minimal',
		stream: true
	});
	console.log({ completion });

	const allLines: string[] = [];
	const send = (line: string) => {
		console.log({ lineToSend: line });
		allLines.push(line);
		recipient.send(line);
	};

	send(JSON.stringify(
		{
			albumName: lrcLibLyrics.albumName,
			artistName: lrcLibLyrics.artistName,
			duration: lrcLibLyrics.duration,
			id: lrcLibLyrics.id,
			instrumental: false,
			trackName: lrcLibLyrics.trackName
		}
	));

	let currentLine = '';
	let chunkCount = 0;
	let firstDeltaTimestamp: number | null = null;
	for await (const processedLyrics of completion) {
		const delta = processedLyrics.choices[0]?.delta?.content ?? '';

		console.log({ delta });

		if (firstDeltaTimestamp === null) {
			firstDeltaTimestamp = Date.now();
			console.log({
				openAiRequest: 'lyrics-processing',
				event: 'first_delta',
				latencyMs: firstDeltaTimestamp - requestStart
			});
		}
		chunkCount += 1;

		currentLine += delta;
		const lines = currentLine.split('\n');
		for (let i = 0; i < lines.length - 1; i++) {
			lines[i] = lines[i].replace(/```/, '').trim();
			// First the lyrics with timestamps:
			send(lines[i]);
			// Then the lyrics without timestamps:
			send(synced ? stripTimestamps(lines[i]) : lines[i]);
		}
		currentLine = lines[lines.length - 1];
	}
	const totalDurationMs = Date.now() - requestStart;
	console.log({
		openAiRequest: 'lyrics-processing',
		event: 'stream_complete',
		durationMs: totalDurationMs,
		chunkCount,
		firstDeltaLatencyMs: firstDeltaTimestamp === null ? null : firstDeltaTimestamp - requestStart
	});

	return allLines;
}

function stripTimestamps(processedLyrics: string) {
	return processedLyrics.replace(/\[\d+:\d+.\d+]/g, '');
}
