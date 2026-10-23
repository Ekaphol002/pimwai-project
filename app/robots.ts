import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/lessons', '/tests', '/farm', '/rankings', '/news'],
                disallow: [
                    '/api/',
                    '/admin/',
                    '/code',
                    '/code/*',
                    '/login',
                    '/login/*',
                    '/progress/',
                    '/lesson/',
                    '/typing-test/',
                    '/*?*callbackUrl*',
                    '/_next/static/media/*.woff2',
                    '/_next/static/media/*.woff',
                    '/*?*level=*',
                ],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
        host: 'https://pimwai.vercel.app',
    }
}
