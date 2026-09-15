/**
 * WebMCP (https://webmachinelearning.github.io/webmcp/): tools a browser agent can call instead of
 * scraping the page. Registered only where `navigator.modelContext` exists; everywhere else this
 * is a no-op. The search client loads on the first call, so pages don't pay for it up front.
 */
type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean }
  execute: (input: Record<string, unknown>) => Promise<unknown>
}
const mc = (navigator as Navigator & { modelContext?: { registerTool(tool: Tool): void } }).modelContext

const text = (t: string) => ({ content: [{ type: 'text', text: t }] })
const strip = (html = '') => html.replace(/<\/?mark>/g, '')
const ID = /^[\w-]{1,64}$/

const markdown = async (path: string) => {
  const res = await fetch(path)
  return text(res.ok ? await res.text() : `غير موجود (${res.status})`)
}

const tools: Tool[] = [
  {
    name: 'search',
    description:
      'Search the transcripts of Sheikh Abu Jaafar al-Khulaifi’s lessons (tab "v") or his articles, fatwas and books (tab "a"). Arabic queries work best. Returns matching excerpts with links.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Arabic words or a question, e.g. «كفارة اليمين»' },
        tab: { type: 'string', enum: ['v', 'a'], description: 'v = lessons (default), a = articles' },
        page: { type: 'integer', minimum: 1, description: '20 results per page' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
    async execute({ query, tab, page }) {
      const { search } = await import('./meili')
      const q = String(query ?? '').trim()
      if (!q) return text('query is empty')
      const r = await search(q, { tab: tab === 'a' ? 'a' : 'v', page: Number(page) || 1 })
      const hits = r.hits.map((h) =>
        'video_id' in h
          ? `- ${h.title} @${Math.floor(h.start)}s — ${location.origin}/v/${h.video_id}/?t=${Math.floor(h.start)} (Markdown: /v/${h.video_id}.md)\n  ${strip(h._formatted?.text ?? h.text)}`
          : `- ${strip(h._formatted?.title ?? h.title)} — ${location.origin}/a/${h.articleId}/#p${h.n} (Markdown: /a/${h.articleId}.md)\n  ${strip(h._formatted?.text ?? h.text)}`,
      )
      const lessons = r.lessons.map((l) => `- ${l.title} — ${location.origin}/v/${l.video_id}/`)
      return text(
        [
          `lessons: ${r.counts.v} hits, articles: ${r.counts.a} hits; page ${r.page}/${r.totalPages}${r.widened ? ' (no exact match — loose results)' : ''}`,
          lessons.length ? `\nLessons covering the whole query:\n${lessons.join('\n')}` : '',
          `\n${hits.join('\n') || 'no results'}`,
        ].join('\n'),
      )
    },
  },
  {
    name: 'get_lesson',
    description: 'Full timestamped transcript of one lesson as Markdown, by YouTube video id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    annotations: { readOnlyHint: true },
    execute: async ({ id }) => (ID.test(String(id)) ? markdown(`/v/${id}.md`) : text('invalid id')),
  },
  {
    name: 'get_article',
    description: 'Full text of one article, fatwa or book as Markdown, by article id (e.g. "post-1000").',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    annotations: { readOnlyHint: true },
    execute: async ({ id }) => (ID.test(String(id)) ? markdown(`/a/${id}.md`) : text('invalid id')),
  },
]

// Astro scripts run once per document; the try covers a browser that already holds a tool by that name.
if (mc) for (const tool of tools) try { mc.registerTool(tool) } catch {}
