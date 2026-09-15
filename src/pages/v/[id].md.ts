import type { APIRoute } from 'astro'
import { contentDigest, segmentsDigest, segmentsOf, videos, type Video } from '../../lib/data'
import { duration, timestamp } from '../../lib/format'
import { SHEIKH, SITE_URL } from '../../lib/seo'

/** The lesson as plain Markdown for LLMs and agents: the same transcript, none of the page chrome. */
export function getStaticPaths() {
  return videos.map((video) => ({
    params: { id: video.id },
    props: { video },
    cacheKey: contentDigest(video, segmentsDigest(video.id)),
  }))
}

export const GET: APIRoute = ({ props }) => {
  const video = props.video as Video
  const page = `${SITE_URL}/v/${video.id}/`
  const lines = segmentsOf(video.id).map((s) => `- [${timestamp(s.s)}](${page}?t=${Math.floor(s.s)}) ${s.t}`)
  const md = [
    `# ${video.title}`,
    '',
    `- المتحدث: ${SHEIKH}`,
    `- الصفحة: ${page}`,
    `- يوتيوب: https://youtu.be/${video.id}`,
    video.uploadDate && `- التاريخ: ${video.uploadDate}`,
    `- المدة: ${duration(video.duration)}`,
    ...video.playlists.map((p) => `- القائمة: [${p.title}](${SITE_URL}/p/${p.id}/)`),
    '',
    '> تفريغ آلي وقد يحتوي أخطاء؛ الأصل هو التسجيل الصوتي.',
    '',
    '## التفريغ',
    '',
    ...(lines.length ? lines : ['لا يوجد تفريغ لهذا الدرس.']),
    '',
  ]
  return new Response(md.filter((l) => l !== null && l !== undefined).join('\n'), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
