type SearchLyricsResponse = Array<{
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
}>

interface GetLyricsResponse {
	id: number;
	trackName: string;
	artistName: string;
	albumName: string;
	duration: number;
	instrumental: boolean;
	plainLyrics: string;
	syncedLyrics: string;
}
