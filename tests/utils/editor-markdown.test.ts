import { describe, expect, it } from 'vitest'
import { preprocessEditorMarkdown } from '~/utils/editor-markdown'

describe('preprocessEditorMarkdown', () => {
  it('returns empty string for empty input', () => {
    expect(preprocessEditorMarkdown('')).toBe('')
  })

  it('converts bare urls into markdown links', () => {
    expect(preprocessEditorMarkdown('Visit https://example.com for details.'))
      .toBe('Visit [https://example.com](https://example.com) for details.')
  })

  it('leaves existing markdown links alone', () => {
    expect(preprocessEditorMarkdown('[Docs](https://example.com)'))
      .toBe('[Docs](https://example.com)')
  })

  it('supports multiple urls in one string', () => {
    expect(preprocessEditorMarkdown('One https://a.dev and two https://b.dev/test'))
      .toBe('One [https://a.dev](https://a.dev) and two [https://b.dev/test](https://b.dev/test)')
  })
})
