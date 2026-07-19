import { GetServerSideProps } from "next"

import { getPosts } from "src/apis"
import { filterPosts } from "src/libs/utils/notion"
import { escapeXml, toAbsoluteUrl, toRssDate } from "src/libs/utils/xml"
import { TPost } from "src/types"
import { CONFIG } from "site.config"

const postDate = (post: TPost): string =>
  post.date?.start_date || post.createdTime

const renderItem = (post: TPost): string => {
  const url = toAbsoluteUrl(CONFIG.link, post.slug)
  const publishedAt = toRssDate(postDate(post))
  const categories = [...(post.category ?? []), ...(post.tags ?? [])]
    .map((category) => `<category>${escapeXml(category)}</category>`)
    .join("")

  return [
    "<item>",
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${escapeXml(url)}</link>`,
    `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
    publishedAt ? `<pubDate>${escapeXml(publishedAt)}</pubDate>` : "",
    `<description>${escapeXml(post.summary ?? "")}</description>`,
    categories,
    "</item>",
  ].join("")
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = filterPosts(await getPosts())
  const feedUrl = toAbsoluteUrl(CONFIG.link, "feed")
  const latestPostDate = posts
    .map((post) => toRssDate(postDate(post)))
    .find((date): date is string => Boolean(date))

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(CONFIG.blog.title)}</title>`,
    `<link>${escapeXml(toAbsoluteUrl(CONFIG.link))}</link>`,
    `<description>${escapeXml(CONFIG.blog.description)}</description>`,
    `<language>${escapeXml(CONFIG.lang)}</language>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    latestPostDate
      ? `<lastBuildDate>${escapeXml(latestPostDate)}</lastBuildDate>`
      : "",
    ...posts.map(renderItem),
    "</channel>",
    "</rss>",
  ].join("")

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8")
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=600, stale-while-revalidate=86400"
  )
  res.write(xml)
  res.end()

  return { props: {} }
}

const Feed = () => null

export default Feed
