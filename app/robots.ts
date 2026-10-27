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
                    '/lesson/',
                    '/typing-test/',
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
                    '/*?*callbackUrl*',
                ],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
        host: 'https://pimwai.vercel.app',
    }
}
