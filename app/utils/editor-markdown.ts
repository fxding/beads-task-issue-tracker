/**
 * Keep the editor's markdown preprocessing narrow: normalize bare URLs into
 * explicit markdown links so the Tiptap markdown pipeline round-trips them
 * consistently.
 */

const URL_RE = /(^|[\s(>])((https?:\/\/)[^\s<)\]]+)/gm

function isInsideMarkdownLink(text: string, urlStart: number): boolean {
  const before = text.slice(0, urlStart)
  const lastOpenBracket = before.lastIndexOf('[')
  const lastCloseBracket = before.lastIndexOf(']')
  const lastOpenParen = before.lastIndexOf('(')

  return lastOpenBracket !== -1
    && lastCloseBracket > lastOpenBracket
    && lastOpenParen === lastCloseBracket + 1
}

export function preprocessEditorMarkdown(markdown: string): string {
  if (!markdown) return ''

  return markdown.replace(URL_RE, (match, prefix: string, url: string, _protocol: string, offset: number) => {
    const urlStart = offset + prefix.length
    if (isInsideMarkdownLink(markdown, urlStart)) return match
    return `${prefix}[${url}](${url})`
  })
}
