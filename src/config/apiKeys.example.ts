
// Example configuration file - copy this to .env or .env.local and add your own API keys
// This file is safe to commit to your repository

// Your .env file should contain:
// VITE_INDIAN_API_KEY=your-indian-api-key-here
// VITE_OPENAI_API_KEY=your-openai-api-key-here

export const INDIAN_API_KEY = import.meta.env.VITE_INDIAN_API_KEY || "your-indian-api-key-here";
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "your-openai-api-key-here";
