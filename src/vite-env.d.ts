/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
  readonly VITE_SUPABASE_SERVICE_KEY: string
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}