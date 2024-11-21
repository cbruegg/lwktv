export type SearchLyricsResponse = Array<{
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
}>

export interface GetLyricsResponse {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
}
