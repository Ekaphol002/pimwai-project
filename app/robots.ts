import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/lessons', '/tests', '/farm', '/rankings', '/login'],
                disallow: [
                    '/api/',
                    '/admin/',
                    '/progress/',
                    '/lesson/',
                    '/typing-test/',
                    '/login?*',
                    '/*?*callbackUrl*',
                    '/_next/static/media/*.woff2'
                ],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
    }
}
