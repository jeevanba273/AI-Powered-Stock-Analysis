
// This file loads environment variables for API keys
// It provides fallbacks for development, but should use actual env vars in production

// API Keys
export const INDIAN_API_KEY = import.meta.env.VITE_INDIAN_API_KEY || "";
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
