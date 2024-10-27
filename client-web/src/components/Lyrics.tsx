import {useLoaderData} from "react-router-dom";
import {GetLyricsResponse} from "../generated/api-types.ts";
import {useEffect, useState} from "react";
import {getLyrics} from "../api.ts";
import {CircularProgress} from "@mui/material";

export function Lyrics() {
    const id = useLoaderData() as number;
    const [lyrics, setLyrics] = useState<GetLyricsResponse | null>(null);

    useEffect(() => {
        (async () => {
            setLyrics(null);
            // TODO Allow setting options
            setLyrics(await getLyrics(id, {}));
        })();
    }, [id]);

    useEffect(() => {
        if (lyrics === null) {
            document.title = "Loading...";
        } else {
            document.title = `${lyrics.trackName} - ${lyrics.artistName}`;
        }
    }, [lyrics]);

    if (lyrics === null) {
        return <CircularProgress/>;
    }

    return (
        <>
            {lyrics && (
                <div>
                    <h2>{lyrics.trackName} - {lyrics.artistName}</h2>
                    <PlainLyrics lyrics={lyrics.plainLyrics}/>
                </div>
            )}
        </>
    );
}

function PlainLyrics({lyrics}: { lyrics: string }) {
    const lines = lyrics.split("\n");
    return (
        <>
            {lines.map((line, i) => (
                <LyricsLine line={line} key={i}/>
            ))}
        </>
    );
}

function LyricsLine({line}: { line: string }) {
    if (line.trim().length === 0) {
        return <></>;
    }

    const hasPinyin = line.includes("~~~");
    const original = hasPinyin ? line.split("~~~")[0] : line;
    const pinyin = hasPinyin ? line.split("~~~")[1] : null;
    return (
        <div style={{lineHeight: "0.5em", padding: "0.125em"}}>
            <p>{original.trim()}</p>
            <p>{pinyin?.trim()}</p>
        </div>
    );
}