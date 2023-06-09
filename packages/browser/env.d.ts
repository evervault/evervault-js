/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EV_TEAM_UUID: string;
  readonly VITE_EV_APP_UUID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
