// API Configuration for easy deployment
// In development, this uses localhost:8080
// In production (Render), set NEXT_PUBLIC_API_URL in Render dashboard

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
