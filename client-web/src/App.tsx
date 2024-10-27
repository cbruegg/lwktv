import './App.css';
import {createBrowserRouter} from "react-router-dom";
import {Lyrics} from "./components/Lyrics.tsx";
import {Search} from "./components/Search.tsx";
import {lyricsLoader} from "./components/LyricsLoader.ts";
import {Root} from "./components/Root.tsx";

// Specification:
// 1. On start, show search bar
// 2. With a debounce of 500ms, search for songs using the searchLyrics function from src/api.ts
// 3. Show the search results in a list
// 4. When clicking on a search result, show the lyrics in a new view by fetching them using the getLyrics function from src/api.ts
//    Clicking on a search result should also update the current URL to include the ID of the selected song.
//    When this application is loaded with a URL that includes a song ID, the lyrics should be fetched and displayed immediately.

// TODO: Support synced lyrics. Tapping on a line should set the synced time to that position.

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        children: [
            {
                path: "",
                element: <Search/>
            },
            {
                path: "lyrics/:id",
                element: <Lyrics/>,
                loader: lyricsLoader
            }
        ]
    }
]);
