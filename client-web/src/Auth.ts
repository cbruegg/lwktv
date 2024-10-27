export function getLocalStorageAuthToken(): string | null {
    return localStorage.getItem("authToken");
}

export function setLocalStorageAuthToken(token: string | null) {
    if (token === "" || token === null) {
        localStorage.removeItem("authToken");
        return;
    }

    localStorage.setItem("authToken", token);
}