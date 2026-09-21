// Why read content from out/renderer instead of the archive: @electron/asar
// extractFile cannot address this archive's backslash-separated entries
// (listPackage shows them, getFile cannot resolve them). out/renderer is the
// exact packager input, so its bytes are what shipped.
import { readFileSync } from 'node:fs'
import asar from '@electron/asar'

const ARCHIVE = 'dist/win-unpacked/resources/app.asar'
const files = asar.listPackage(ARCHIVE)

const need = ['\\out\\main\\index.js', '\\out\\preload\\index.js', '\\out\\renderer\\index.html']
for (const n of need) {
  console.log(`ENTRY ${n}: ${files.includes(n) ? 'PRESENT' : 'MISSING'}`)
}
console.log(`TOTAL_FILES: ${files.length}`)

const pathLeak = /[A-Za-z]:[\\/]/
const pathHits = files.filter((f) => pathLeak.test(f))
console.log(`PATH_LEAKS: ${pathHits.length}`)
for (const hit of pathHits.slice(0, 5)) {
  console.log(`  LEAK: ${hit}`)
}

const html = readFileSync('out/renderer/index.html', 'utf8')
console.log(`CSP: ${html.includes('Content-Security-Policy') ? 'PRESENT' : 'MISSING'}`)
console.log(`INLINE_SCRIPT: ${/<script(?![^>]*src=)/.test(html)}`)
const contentLeaks = [/O:\//, /Users\/omarb/i, /Claude Code/].map((r) => r.test(html))
console.log(`HTML_LEAKS(o-drive,user,workspace): ${contentLeaks.join(',')}`)
