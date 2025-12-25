import React from 'react';
import axios from "axios";
import {
    getAuthURL,
    generateRandomString,
    generateCodeChallenge,
} from "./utils/spotifyAuth";

const Login = () => {

    const login = async () => {
        const codeVerifier = generateRandomString(128);
        sessionStorage.setItem("code_verifier", codeVerifier);

        const codeChallenge = await generateCodeChallenge(codeVerifier);
        window.location.href = getAuthURL(codeChallenge);
    };

    return (
        <button onClick={login}>
        Start!
        </button>
    );
};

export default Login;