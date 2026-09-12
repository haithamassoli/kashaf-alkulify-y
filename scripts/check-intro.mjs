// node scripts/check-intro.mjs — exercise the actual inline bootstrap, without a browser dependency.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const script = readFileSync(new URL('../src/lib/welcome-intro.js', import.meta.url), 'utf8')
function visit({ seen = false, reduced = false, blocked = false } = {}) {
  const events = {}
  let open = false
  let timer
  let saved = seen
  const intro = {
    showModal() { open = true },
    close() { open = false; events.close() },
    querySelector: () => ({ addEventListener: (name, fn) => { events[name] = fn } }),
    addEventListener: (name, fn) => { events[name] = fn },
  }
  runInNewContext(script, {
    document: { getElementById: () => intro },
    matchMedia: () => ({
      matches: reduced,
      addEventListener: (name, fn) => { events[name] = fn },
      removeEventListener() {},
    }),
    sessionStorage: {
      getItem() { if (blocked) throw Error('blocked'); return saved },
      setItem() { saved = true },
    },
    setTimeout(fn, ms) { assert.equal(ms, 3200); timer = fn; return 1 },
    clearTimeout() { timer = undefined },
    addEventListener: (name, fn) => { events[name] = fn },
    removeEventListener() {},
  })
  return { events, isOpen: () => open, saved: () => saved, timeout: () => timer?.() }
}
for (const action of ['click', 'change', 'pagehide', 'timeout']) {
  const first = visit()
  assert.ok(first.isOpen() && first.saved())
  if (action === 'timeout') first.timeout()
  else first.events[action]()
  assert.equal(first.isOpen(), false, action)
  assert.equal(visit({ seen: first.saved() }).isOpen(), false)
}
assert.equal(visit({ reduced: true }).isOpen(), false)
assert.equal(visit({ blocked: true }).isOpen(), false)
if (process.argv.includes('--built')) {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
  const hash = createHash('sha256').update(script).digest('base64')
  assert.ok(html.includes(script), 'the build must preserve the hashed script exactly')
  assert.ok(html.includes(`sha256-${hash}`), 'CSP must authorize the introduction in production')
}
console.log('intro check ok')
