import {useEffect, useState} from "react";
import {SearchLyricsResponse} from "../generated/api-types.ts";
import {searchLyrics} from "../api.ts";
import {Link} from "react-router-dom";
import {TextField} from "@mui/material";

export function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchLyricsResponse | null>(null);

    const handleSearch = async (query: string) => {
        if (query) {
            const results = await searchLyrics(query);
            setResults(results);
        } else {
            setResults([]);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            handleSearch(query);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    return (
        <div>
            <TextField
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for songs..."
            />
            <div>
                {results && results.map((result) => (
                    <div key={result.id}>
                        <Link to={`/lyrics/${result.id}`}>{result.trackName} - {result.artistName}</Link>
                    </div>
                ))}
            </div>
        </div>
    );
}