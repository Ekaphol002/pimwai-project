import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/lessons', '/tests', '/rankings', '/login'],
                disallow: ['/api/', '/admin/', '/progress/', '/lesson/', '/typing-test/'],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
    }
}
