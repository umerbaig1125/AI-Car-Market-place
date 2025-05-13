/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental:{
        serverComponentsHmrCache: false,
    },
    images:{
        remotePatterns:[
            {
                protocol:"https",
                hostname: "hdllqczjjaurbwwfxkdo.supabase.co"
            }
        ]
    }
};

export default nextConfig;
