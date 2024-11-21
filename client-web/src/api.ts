import {GetLyricsResponse, SearchLyricsResponse} from "./generated/api-types";
import {getLocalStorageAuthToken} from "./Auth.ts";

// const baseUrl = "https://lwktv-worker.cbruegg.workers.dev/";

const baseUrl = "http://localhost:8787/"

export async function searchLyrics(query: string): Promise<SearchLyricsResponse> {
    return (await fetch(`${baseUrl}search?q=${query}`, fetchOptions())).json();
}

export function getLyrics(id:
                          number, options: {
                              traditionalToSimplified?: boolean,
                              addPinyin?: boolean,
                              addTranslation?: boolean,
                          },
                          getLyricsResponseConsumer: (response: GetLyricsResponse) => void,
                          syncedLyricsConsumer: (line: string) => void,
                          plainLyricsConsumer: (line: string) => void
) {

    const params = new URLSearchParams();
    if (options.traditionalToSimplified !== undefined) params.set("traditionalToSimplified", `${options.traditionalToSimplified}`);
    if (options.addPinyin !== undefined) params.set("addPinyin", `${options.addPinyin}`);
    if (options.addTranslation !== undefined) params.set("addTranslation", `${options.addTranslation}`);
    params.set("api", "v5");
    params.set("token", getLocalStorageAuthToken() ?? "");
    const webSocket = new WebSocket(`${baseUrl}lyrics/${id}?${params}`);

    let didReadGetLyricsResponse = false;
    let justReadSyncedLyrics = false;
    let syncedLyrics = "";
    let plainLyrics = "";
    webSocket.onmessage = (event) => {
        console.log({line: event.data});
        const line = event.data as string;

        if (line == "%EOF%") {
            webSocket.close();
        } else if (!didReadGetLyricsResponse) {
            const getLyricsResponse = JSON.parse(line);
            getLyricsResponseConsumer(getLyricsResponse);
            didReadGetLyricsResponse = true;
        } else if (justReadSyncedLyrics) {
            plainLyrics += line + "\n";
            plainLyricsConsumer(plainLyrics);
            justReadSyncedLyrics = false;
        } else {
            syncedLyrics += line + "\n";
            syncedLyricsConsumer(syncedLyrics);
            justReadSyncedLyrics = true;
        }
    }

    return () => webSocket.close();
}

function fetchOptions(): RequestInit {
    return {
        headers: {
            Authorization: `Bearer ${getLocalStorageAuthToken()}`
        }
    };
}