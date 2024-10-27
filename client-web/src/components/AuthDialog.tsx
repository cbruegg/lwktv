import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@mui/material";
import {useState} from "react";
import {setLocalStorageAuthToken} from "../Auth.ts";

export function AuthDialog({open, onSave}: { open: boolean, onSave: () => void }) {
    const [token, setToken] = useState(localStorage.getItem("authToken") ?? "");

    function save() {
        setLocalStorageAuthToken(token);
        onSave();
    }

    return <Dialog open={open}>
        <DialogTitle>
            {"Enter the authentication token"}
        </DialogTitle>
        <DialogContent>
            <DialogContentText>
                An authentication token is required.
            </DialogContentText>
            <TextField type="password" label="Token" variant="filled" value={token}
                       onChange={(e) => setToken(e.target.value)}/>
        </DialogContent>
        <DialogActions>
            <Button onClick={save} autoFocus>
                Save
            </Button>
        </DialogActions>
    </Dialog>
}