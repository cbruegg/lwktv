import {useEffect, useState} from "react";
import {SearchLyricsResponse} from "../generated/api-types.ts";
import {searchLyrics} from "../api.ts";
import {Link} from "react-router-dom";
import {Box, Button, List, ListItemButton, TextField, Typography} from "@mui/material";

export function Search() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<SearchLyricsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (query: string) => {
        if (query) {
            const response = await searchLyrics(query);
            setResponse(response);
            setIsLoading(false);
        } else {
            setResponse(null);
        }
    };

    useEffect(() => {
        const handler = setTimeout(async () => {
            await handleSearch(query);
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
                onChange={(e) => {
                    setIsLoading(true);
                    setQuery(e.target.value);
                }}
                placeholder="Search for songs..."
            />
            <br/>
            {!isLoading && response && response.resolvedQuery !== query && response.resolvedQuery !== "" &&
                <Button onClick={() => setQuery(response.resolvedQuery)}>Did you
                    mean: {response.resolvedQuery}</Button>
            }
            <List>
                {response && response.results.map((result) => (

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