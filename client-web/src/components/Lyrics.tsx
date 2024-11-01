import {useLoaderData, useSearchParams} from "react-router-dom";
import {GetLyricsResponse} from "../generated/api-types.ts";
import {useEffect, useState} from "react";
import {getLyrics} from "../api.ts";
import {Checkbox, CircularProgress, FormControlLabel, FormGroup} from "@mui/material";

export function Lyrics() {
    const id = useLoaderData() as number;
    const [searchParams, setSearchParams] = useSearchParams();
    const translate = searchParams.get("translate") === "true";
    const [lyrics, setLyrics] = useState<GetLyricsResponse | null>(null);

    useEffect(() => {
        (async () => {
            setLyrics(null);
            // TODO Allow setting options
            setLyrics(await getLyrics(id, {addTranslation: translate}));
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
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={translate}
                                    disabled={false}
                                    onChange={e => setSearchParams({
                                        ...searchParams,
                                        translate: e.target.checked ? "true" : undefined
                                    })}/>
                            }
                            label="Translate"/>
                    </FormGroup>
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

    const lines = line.split("~~~");
    return (
        <p>
            {lines.map((line, i) => (
                <span key={i}>
                    {line}
                    {i < lines.length - 1 && <br/>}
                </span>
            ))}
        </p>
    );
}