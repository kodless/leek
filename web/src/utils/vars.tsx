let env = {
    "LEEK_API_URL": undefined,
    "LEEK_FIREBASE_API_KEY": undefined,
    "LEEK_FIREBASE_AUTH_DOMAIN": undefined,
    "LEEK_FIREBASE_DATABASE_URL": undefined,
    "LEEK_FIREBASE_PROJECT_ID": undefined,
    "LEEK_FIREBASE_STORAGE_BUCKET": undefined,
    "LEEK_FIREBASE_MESSAGING_SENDER_ID": undefined,
    "LEEK_FIREBASE_APP_ID": undefined,
    "LEEK_FIREBASE_MEASUREMENT_ID": undefined
};
if (typeof window !== 'undefined') {
    env = window["_env_"];
}
export default env;
