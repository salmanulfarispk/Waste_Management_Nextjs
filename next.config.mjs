/** @type {import('next').NextConfig} */
const nextConfig = {
    env:{
        MONGODB_URI: process.env.MONGODB_URI,
        WEB3_AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID
    }
};

export default nextConfig;
