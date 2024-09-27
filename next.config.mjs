/** @type {import('next').NextConfig} */
const nextConfig = {
    env:{
        MONGODB_URI: process.env.MONGODB_URI,
        WEB3_AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
    }
};

export default nextConfig;
