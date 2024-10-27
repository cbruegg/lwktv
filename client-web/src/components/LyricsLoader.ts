import {LoaderFunction} from "react-router-dom";

// TODO: Add a loading spinner

export const lyricsLoader: LoaderFunction<number> = async ({params}) => {
    const idStr = params.id;
    if (idStr === undefined) {
        throw new Error("Missing ID");
    }
    return parseInt(idStr);
}