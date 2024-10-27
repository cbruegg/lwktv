import {Outlet, useNavigate, useNavigation} from "react-router-dom";
import {Button, CircularProgress} from "@mui/material";
import {AuthDialog} from "./AuthDialog.tsx";
import {getLocalStorageAuthToken, setLocalStorageAuthToken} from "../Auth.ts";
import {useState} from "react";

export function Root() {
    const navigation = useNavigation();
    const navigate = useNavigate();
    const [authToken, setAuthToken] = useState(getLocalStorageAuthToken());

    function logout() {
        setLocalStorageAuthToken(null);
        setAuthToken(null);
        navigate("/");
    }

    return <div className="App" style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
    }}>
        <div style={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
            <Button onClick={() => logout()}>Logout</Button>
        </div>
        <div style={{flexGrow: 1, display: "flex", justifyContent: "center", padding: "2rem"}}>
            <AuthDialog open={authToken === null} onSave={() => setAuthToken(getLocalStorageAuthToken)}/>
            {authToken !== null && (navigation.state == "loading" ? <CircularProgress/> : <Outlet/>)}
        </div>
    </div>
}