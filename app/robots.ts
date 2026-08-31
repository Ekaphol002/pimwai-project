import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/rankings', '/login'],
                disallow: ['/api/', '/admin/', '/progress/', '/lessons/', '/tests/', '/lesson/', '/typing-test/'],
            }
        ],
        sitemap: 'https://pimwai.vercel.app/sitemap.xml',
    }
}
