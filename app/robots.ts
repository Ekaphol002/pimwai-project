import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/lessons',
                    '/tests',
                    '/rankings',
                    '/news',
                ],
                disallow: [
                    '/api/',
                    '/admin/',
                    '/code',
                    '/code/*',
                    '/login',
                    '/login/*',
                    '/progress/',
                    '/settings',
                    '/reset-account',
                    '/lesson/',
                    '/typing-test/',
                    '/*?*callbackUrl*',
                    '/*?*level=*',
                    '/_next/static/media/*.woff2',
                    '/_next/static/media/*.woff',
                ],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
        host: 'https://pimwai.vercel.app',
    }
}
