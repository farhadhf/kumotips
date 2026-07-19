import { GetServerSideProps } from "next"

import { getPosts } from "src/apis"
import {
  FilterPostsOptions,
  filterPosts,
} from "src/libs/utils/notion/filterPosts"
import { escapeXml, toAbsoluteUrl, toIsoDate } from "src/libs/utils/xml"
import { TPost } from "src/types"
import { CONFIG } from "site.config"

const sitemapFilter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

const postDate = (post: TPost): string =>
  post.date?.start_date || post.createdTime

const renderUrl = (
  location: string,
  lastModified: string | undefined,
  priority: string
): string =>
  [
    "<url>",
    `<loc>${escapeXml(location)}</loc>`,
    lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : "",
    "<changefreq>weekly</changefreq>",
    `<priority>${priority}</priority>`,
    "</url>",
  ].join("")

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = filterPosts(await getPosts(), sitemapFilter).filter(
    (post, index, allPosts) =>
      allPosts.findIndex((candidate) => candidate.slug === post.slug) === index
  )
  const latestPostDate = posts
    .map((post) => toIsoDate(postDate(post)))
    .find((date): date is string => Boolean(date))

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    renderUrl(toAbsoluteUrl(CONFIG.link), latestPostDate, "1.0"),
    ...posts.map((post) =>
      renderUrl(
        toAbsoluteUrl(CONFIG.link, post.slug),
        toIsoDate(postDate(post)),
        "0.7"
      )
    ),
    "</urlset>",
  ].join("")

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=600, stale-while-revalidate=86400"
  )
  res.write(xml)
  res.end()

  return { props: {} }
}

const Sitemap = () => null

export default Sitemap
