import {Outlet, useNavigation} from "react-router-dom";
import {CircularProgress} from "@mui/material";

export function Root() {
    const navigation = useNavigation();

    return <div className="App">
        {navigation.state == "loading" ? <CircularProgress/> : <Outlet/>}
    </div>
}