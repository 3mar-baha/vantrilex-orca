// Production-only Content Security Policy for the desktop renderer shells.
//
// Why a build-time meta tag instead of a committed one: `electron-vite dev`
// serves HMR over websocket with inline client scripts, which a strict
// policy would break. `apply: 'build'` keeps development untouched while
// every packaged entry (index, popout, web) ships the lockdown.
//
// Why these directives:
// - script-src 'self': bundles are external files; modulePreload polyfill
//   is disabled in config because the shipped Chromium supports it natively.
// - style-src 'unsafe-inline': React, xterm.js, and Tailwind set inline
//   styles at runtime; no way around it in an Electron renderer.
// - connect-src 'self': provider traffic (Fish Audio, Groq) runs in the
//   main process over Node fetch, never from the renderer.
// - media-src/img blob+data: TTS clips play from blob URLs; avatars embed data URIs.
// - object-src 'none', frame-anchors 'none': no plugins, no embedding.
export const PRODUCTION_CSP =
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "media-src 'self' blob:; " +
  "font-src 'self' data:; " +
  "worker-src 'self' blob:; " +
  "child-src 'self' blob:; " +
  "frame-src 'self'; " +
  "connect-src 'self'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "frame-ancestors 'none'"

export function createProductionCspMetaPlugin() {
  return {
    name: 'vantrilex-production-csp-meta',
    apply: 'build',
    transformIndexHtml(html: string) {
      if (html.includes('Content-Security-Policy')) {
        return html
      }
      return html.replace(
        /<meta charset="UTF-8" \/>/,
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`
      )
    }
  }
}
