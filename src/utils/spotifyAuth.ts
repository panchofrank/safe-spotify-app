import queryString from "query-string";
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SCOPES } from "../spotifyConfig";
export function generateRandomString(length: number) {
    // Must include ALL these characters for a valid PKCE code verifier
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function generateCodeChallenge(codeVerifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export function getAuthURL(codeChallenge: string) {
    const query = queryString.stringify({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES.join(" "),
        redirect_uri: REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
    });
    return `https://accounts.spotify.com/authorize?${query}`;
}
