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
            <p>Ready to set sail? 🏴‍☠️</p>
            <button className="spotify-btn" onClick={login}>⚓ Set sail!</button>
        </div>

    );
};

export default Login;