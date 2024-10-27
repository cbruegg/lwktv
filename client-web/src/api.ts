import {GetLyricsResponse, SearchLyricsResponse} from "./generated/api-types";
import {getLocalStorageAuthToken} from "./Auth.ts";

// const baseUrl = "https://lwktv-worker.cbruegg.workers.dev/";
const baseUrl = "http://localhost:8787/"

export async function searchLyrics(query: string): Promise<SearchLyricsResponse> {
    return (await fetch(`${baseUrl}search?q=${query}`, fetchOptions())).json();
}

export async function getLyrics(id: number, options: {
    traditionalToSimplified?: boolean,
    addPinyin?: boolean,
    addTranslation?: boolean
}): Promise<GetLyricsResponse> {
    const params = new URLSearchParams();
    if (options.traditionalToSimplified !== undefined) params.set("traditionalToSimplified", "true");
    if (options.addPinyin !== undefined) params.set("addPinyin", "true");
    if (options.addTranslation !== undefined) params.set("addTranslation", "true");
    return (await fetch(`${baseUrl}lyrics/${id}?${params}`, fetchOptions())).json();
}

function fetchOptions(): RequestInit {
    return {
        headers: {
            Authorization: `Bearer ${getLocalStorageAuthToken()}`
        }
    };
}