import firebase from "firebase/app";
import "firebase/auth";
import env from "./vars";

// Initialize Firebase
const firebaseConfig = {
    apiKey: env.LEEK_FIREBASE_API_KEY,
    authDomain: env.LEEK_FIREBASE_AUTH_DOMAIN,
    projectId: env.LEEK_FIREBASE_PROJECT_ID,
    appId: env.LEEK_FIREBASE_APP_ID,
};

let firebaseCache;

const getFirebase = () => {
    if (env.LEEK_API_ENABLE_AUTH === "false")
        return

    if (firebaseCache) {
        return firebaseCache
    }

    firebase.initializeApp(firebaseConfig);
    firebaseCache = firebase;

    return firebaseCache;
};


export default getFirebase;
