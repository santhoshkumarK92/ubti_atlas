// Central place for environment-driven settings (server side).

const env = (k: string, d = '') => (process.env[k] ?? d).trim();

export const config = {
  siteUrl: env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  sessionSecret: env('SESSION_SECRET', 'dev-only-insecure-secret-change-me'),
  requireLogin: env('SITE_REQUIRE_LOGIN') === 'true',
  demoPassword: env('DEMO_ADMIN_PASSWORD', 'atlas-demo'),
  bootstrapAdmins: env('BOOTSTRAP_ADMIN_EMAILS')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  allowedDomains: env('ALLOWED_EMAIL_DOMAINS')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  firebase: {
    projectId: env('FIREBASE_PROJECT_ID'),
    clientEmail: env('FIREBASE_CLIENT_EMAIL'),
    privateKey: env('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    bucket: env('FIREBASE_STORAGE_BUCKET'),
  },
  ai: {
    provider: env('AI_PROVIDER', 'none') as 'azure' | 'openai' | 'none',
    azure: {
      endpoint: env('AZURE_OPENAI_ENDPOINT').replace(/\/$/, ''),
      apiKey: env('AZURE_OPENAI_API_KEY'),
      apiVersion: env('AZURE_OPENAI_API_VERSION', '2024-10-21'),
      chat: env('AZURE_OPENAI_CHAT_DEPLOYMENT', 'gpt-4o'),
      embedding: env('AZURE_OPENAI_EMBEDDING_DEPLOYMENT', 'text-embedding-3-small'),
    },
    openai: {
      apiKey: env('OPENAI_API_KEY'),
      model: env('OPENAI_MODEL', 'gpt-4o-mini'),
      embedding: env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    },
    dimensions: Number(env('EMBEDDING_DIMENSIONS', '1536')) || 1536,
  },
  maxUploadMb: Number(env('MAX_UPLOAD_MB', '500')) || 500,
  cronSecret: env('CRON_SECRET'),
};

/** Firebase is used when the service-account trio is present; otherwise LOCAL MODE. */
export const useFirebase = Boolean(
  config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey,
);

export const aiEnabled =
  (config.ai.provider === 'azure' && !!config.ai.azure.endpoint && !!config.ai.azure.apiKey) ||
  (config.ai.provider === 'openai' && !!config.ai.openai.apiKey);
