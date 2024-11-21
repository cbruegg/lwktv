import {useEffect, useState} from "react";
import {SearchLyricsResponse} from "../generated/api-types.ts";
import {searchLyrics} from "../api.ts";
import {Link} from "react-router-dom";
import {Box, List, ListItemButton, TextField, Typography} from "@mui/material";

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
        <div style={{margin: "0 auto"}}>
            <TextField
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for songs..."
            />
            <List>
                {results && results.map((result) => (

                    <ListItemButton key={result.id} component={Link} to={`/lyrics/${result.id}`}>
                        <Box>
                            <Typography variant="button">{result.trackName}</Typography>
                            <Typography variant="subtitle2" color="textSecondary">{result.artistName}</Typography>
                        </Box>
                    </ListItemButton>
                ))}
            </List>
        </div>
    );
}