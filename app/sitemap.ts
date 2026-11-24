import { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/newsPosts'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://pimwai.com'
    const now = new Date()

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/lessons`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.95,
        },
        {
            url: `${baseUrl}/tests`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/typing-test/1-minute`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/typing-test/3-minute`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/typing-test/5-minute`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.85,
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
            priority: 0.85,
        },
    ]

    const newsArticleRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}/news/${post.id}`,
        lastModified: new Date(post.isoDate || now),
        changeFrequency: 'monthly',
        priority: 0.8,
    }))

    return [...staticRoutes, ...newsArticleRoutes]
}
