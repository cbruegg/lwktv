export type SearchLyricsResponse = {
	resolvedQuery: string;
	results: SearchLyricsResult[];
}

export type SearchLyricsResult = {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
}

export interface GetLyricsResponse {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
}
