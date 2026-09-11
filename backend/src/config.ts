export interface AppConfig {
  port: number;
  geminiApiKey: string;
  geminiModel: string;
  corsOrigin: string;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  };
}
