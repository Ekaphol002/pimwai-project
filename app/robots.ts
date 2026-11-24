import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/lessons',
                    '/lesson/',
                    '/tests',
                    '/typing-test/',
                    '/rankings',
                    '/news',
                    '/news/',
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
                    '/*?*level=*',
                ],
            }
        ],
        sitemap: 'https://pimwai.com/sitemap.xml',
        host: 'https://pimwai.com',
    }
}
