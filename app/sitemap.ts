import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://pimwai.vercel.app'
    const now = new Date()

    return [
        {
            url: `${baseUrl}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/lessons`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.95,
        },
        {
            url: `${baseUrl}/tests`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/rankings`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/news`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]
}
