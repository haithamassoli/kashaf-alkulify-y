import type { APIRoute } from 'astro'
import { allArticles, contentDigest, type Article } from '../../lib/data'
import { SHEIKH, SITE_URL } from '../../lib/seo'

/** The article as plain Markdown for LLMs and agents. */
export function getStaticPaths() {
  return allArticles().map((article) => ({
    params: { id: article.id },
    props: { article },
    cacheKey: contentDigest(article),
  }))
}

export const GET: APIRoute = ({ props }) => {
  const a = props.article as Article
  const md = [
    `# ${a.title}`,
    '',
    `- الكاتب: ${SHEIKH}`,
    `- الصفحة: ${SITE_URL}/a/${a.id}/`,
    `- المصدر: ${a.url}`,
    a.date && `- التاريخ: ${a.date}`,
    a.categories.length && `- التصنيفات: ${a.categories.join('، ')}`,
    a.download && `- PDF: ${a.download}`,
    '',
    ...a.paragraphs.flatMap((p) => [p, '']),
  ]
  return new Response(md.filter((l) => typeof l === 'string').join('\n'), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
