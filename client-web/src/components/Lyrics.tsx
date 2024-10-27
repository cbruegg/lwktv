import {useLoaderData} from "react-router-dom";
import {GetLyricsResponse} from "../generated/api-types.ts";
import {useEffect} from "react";

export function Lyrics() {
    const lyrics = useLoaderData() as GetLyricsResponse;

    useEffect(() => {
        document.title = `${lyrics.trackName} - ${lyrics.artistName}`;
    }, [lyrics]);

    return (
        <div>
            {lyrics && (
                <div>
                    <h2>{lyrics.trackName} - {lyrics.artistName}</h2>
                    <PlainLyrics lyrics={lyrics.plainLyrics}/>
                </div>
            )}
        </div>
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