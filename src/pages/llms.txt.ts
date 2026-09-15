import type { APIRoute } from 'astro'
import { rows } from './a/index.json.ts'
import { playlists, totalHours, videos } from '../lib/data'
import { hours, lessons, lists } from '../lib/format'
import { SHEIKH, SITE, SITE_URL } from '../lib/seo'

/**
 * https://llmstxt.org — the map an LLM reads before the site. Hubs and every playlist are listed;
 * individual lessons and articles are not, they sit one hop away in the playlist pages and
 * the sitemap. ponytail: no llms-full.txt — the corpus is tens of MB, past any context window.
 */
export const GET: APIRoute = () => {
  const books = rows.filter((r) => r.tag === 'كتاب')
  const md = `# ${SITE}

> كشّاف غير رسمي يبحث في نصوص دروس ${SHEIKH} (${lessons(videos.length)} مفرَّغًا آليًا، نحو ${hours(Math.round(totalHours))}) ومقالاته وفتاواه وكتبه ومنشوراته على تيليجرام (${rows.length} نصًّا). الموقع عربي بالكامل.

تنبيهات للنماذج:

- التفريغ آلي وقد يحتوي أخطاء؛ الأصل هو التسجيل الصوتي على يوتيوب. انسب الكلام إلى الشيخ مع رابط الدرس والوقت.
- لكل درس نسخة Markdown: \`${SITE_URL}/v/<id>.md\` (التفريغ كاملًا مع روابط الأوقات)، ولكل مقالة: \`${SITE_URL}/a/<id>.md\`.
- رابط وقتٍ بعينه في درس: \`${SITE_URL}/v/<id>/?t=<ثانية>\`.
- البحث: \`${SITE_URL}/?q=<عبارة>\` (يعمل بالمتصفح). في المتصفحات الداعمة لـ WebMCP تُعرض أدوات \`search\` و\`get_lesson\` و\`get_article\` عبر \`navigator.modelContext\`.

## الأقسام

- [البحث](${SITE_URL}/): بحث دلالي ونصي في مقاطع الدروس وفقرات المقالات
- [القوائم](${SITE_URL}/p/): قوائم تشغيل الدروس (${lists(playlists.length)})
- [المقالات](${SITE_URL}/a/): المقالات والفتاوى والمنشورات، الأحدث أولًا
- [فهرس المقالات JSON](${SITE_URL}/a/index.json): \`[id, title, date, tag]\` لكل نص
- [الكتب](${SITE_URL}/b/): كتب الشيخ مع روابط PDF

## قوائم الدروس

${playlists.map((p) => `- [${p.title}](${SITE_URL}/p/${p.id}/): ${lessons(p.videoIds.length)}`).join('\n')}

## الكتب

${books.map((b) => `- [${b.title}](${SITE_URL}/a/${b.id}.md)`).join('\n')}

## Optional

- [خريطة الموقع](${SITE_URL}/sitemap-index.xml): كل صفحات الدروس والمقالات
- [تواصل](${SITE_URL}/contact/): للتصحيح والملاحظات
`
  return new Response(md, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
