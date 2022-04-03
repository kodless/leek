let env = {
  LEEK_API_URL: undefined,
  LEEK_API_ENABLE_AUTH: "true",
  LEEK_FIREBASE_API_KEY: undefined,
  LEEK_FIREBASE_AUTH_DOMAIN: undefined,
  LEEK_FIREBASE_PROJECT_ID: undefined,
  LEEK_FIREBASE_APP_ID: undefined,
  LEEK_VERSION: "-.-.-",
};

export default typeof window !== "undefined" ? window["leek_config"] : env;
