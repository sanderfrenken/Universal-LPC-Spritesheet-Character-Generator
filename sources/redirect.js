// Check Current Origin
const from = 'sanderfrenken.github.io'
const to = 'liberatedpixelcup.github.io'
const repo = 'Universal-LPC-Spritesheet-Character-Generator'
if (window.location.host === from) {
    const protocol = window.location.protocol
    const path = (window.location.pathname === '/' || window.location.pathname === '') ? '/' + repo + '/' : window.location.pathname
    const search = window.location.search
    const hash = window.location.hash
    const redirectTo = protocol + '//' + to + path + search + hash
    location.href = redirectTo
}