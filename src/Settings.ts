const SETTINGS_PROD = {
  WEB_URL: "https://cally-chi.vercel.app/",
  API_URL: "https://cally-chi.vercel.app/api"
};

const SETTINGS_DEV = {
  WEB_URL: "http://localhost:5173",
  API_URL: "http://localhost:3000/api"
};


const Settings = import.meta.env.PROD ? SETTINGS_PROD : SETTINGS_DEV;

//TOOD: fix this, only used locally because Vercel caches some paths and returns stale headers
export const t = import.meta.env.PROD ? Date.now() : '';

export default Settings;