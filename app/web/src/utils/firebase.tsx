import env from "./vars";
import { initializeApp } from "firebase/app"
import {
    getAuth,
} from "firebase/auth";

// Initialize Firebase
const firebaseConfig = {
    apiKey: env.LEEK_FIREBASE_API_KEY,
    authDomain: env.LEEK_FIREBASE_AUTH_DOMAIN,
    projectId: env.LEEK_FIREBASE_PROJECT_ID,
    appId: env.LEEK_FIREBASE_APP_ID,
};

let auth;

const getFirebase = () => {
    if (env.LEEK_API_ENABLE_AUTH === "false")
        return

    if (auth) {
        return auth
    }

    initializeApp(firebaseConfig);
    auth = getAuth();

    return auth;
};


export default getAuth;
