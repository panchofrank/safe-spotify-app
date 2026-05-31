import React from 'react';
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

        <div className="login-card">
            <p>Ready to launch the music?</p>
            <button className="spotify-btn" onClick={login}>🚀 Launch!</button>
        </div>

    );
};

export default Login;