/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true,
        serverActions: {
            bodySizeLimit: '10mb', 
        },
    },
    env:{
        MONGODB_URI: process.env.MONGODB_URI,
        WEB3_AUTH_CLIENT_ID: process.env.WEB3_AUTH_CLIENT_ID,
        HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY
    },
   
};

export default nextConfig;
