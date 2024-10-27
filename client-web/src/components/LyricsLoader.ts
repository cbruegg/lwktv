import {LoaderFunction} from "react-router-dom";
import {GetLyricsResponse} from "../generated/api-types.ts";
import {getLyrics} from "../api.ts";

// TODO: Add a loading spinner

export const lyricsLoader: LoaderFunction<GetLyricsResponse> = async ({params}) => {
    const idStr = params.id;
    if (idStr === undefined) {
        throw new Error("Missing ID");
    }
    // TODO Support options
    return await getLyrics(parseInt(idStr), {});
}