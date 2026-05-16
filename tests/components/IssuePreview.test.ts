import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import IssuePreview from '~/components/details/IssuePreview.vue'
import type { Issue, UpdateIssuePayload } from '~/types/issue'

vi.mock('~/components/ui/button', () => ({
  Button: defineComponent({
    name: 'ButtonStub',
    props: ['type', 'disabled'],
    emits: ['click'],
    setup(props, { slots, emit, attrs }) {
      return () => h('button', {
        ...attrs,
        type: props.type ?? 'button',
        disabled: props.disabled,
        onClick: (event: MouseEvent) => emit('click', event),
      }, slots.default?.())
    },
  }),
}))

vi.mock('~/components/ui/linkified-text', () => ({
  LinkifiedText: defineComponent({
    name: 'LinkifiedTextStub',
    props: ['text', 'fallback'],
    setup(props) {
      return () => h('div', props.text || props.fallback || '')
    },
  }),
}))

vi.mock('~/components/ui/markdown-editor', () => ({
  MarkdownEditor: defineComponent({
    name: 'MarkdownEditorStub',
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue', 'blur'],
    setup(props, { emit, attrs }) {
      return () => h('textarea', {
        ...attrs,
        'data-testid': 'inline-markdown-editor',
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
        onBlur: () => emit('blur'),
      })
    },
  }),
}))

vi.mock('~/components/details/IssueAttachmentsSection.vue', () => ({
  default: defineComponent({
    name: 'IssueAttachmentsSectionStub',
    props: ['issueId', 'readonly'],
    emits: ['detach-image'],
    setup(props) {
      return () => h('div', { 'data-testid': 'attachments-section' }, `attachments:${props.issueId}`)
    },
  }),
}))

vi.mock('~/components/details/CommentSection.vue', () => ({
  default: defineComponent({
    name: 'CommentSectionStub',
    props: ['comments', 'readonly', 'embedded'],
    emits: ['add-comment'],
    setup(props, { emit }) {
      return () => h('div', { 'data-testid': 'comment-section' }, [
        h('span', `comments:${props.comments?.length ?? 0}`),
        h('span', ` embedded:${String(props.embedded)}`),
        h('button', { onClick: () => emit('add-comment', 'Test comment') }, 'add-comment'),
      ])
    },
  }),
}))

vi.mock('~/components/ui/tabs', () => ({
  Tabs: defineComponent({
    name: 'TabsStub',
    props: ['defaultValue'],
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'tabs-root' }, slots.default?.())
    },
  }),
  TabsList: defineComponent({
    name: 'TabsListStub',
    setup(_, { slots }) {
      return () => h('div', { 'data-testid': 'tabs-list' }, slots.default?.())
    },
  }),
  TabsTrigger: defineComponent({
    name: 'TabsTriggerStub',
    props: ['value'],
    setup(props, { slots }) {
      return () => h('button', { 'data-testid': `tab-trigger-${props.value}` }, slots.default?.())
    },
  }),
  TabsContent: defineComponent({
    name: 'TabsContentStub',
    props: ['value'],
    setup(props, { slots }) {
      return () => h('div', { 'data-testid': `tab-content-${props.value}` }, slots.default?.())
    },
  }),
}))

vi.mock('~/components/issues/StatusBadge.vue', () => ({
  default: defineComponent({
    name: 'StatusBadgeStub',
    setup() {
      return () => h('div')
    },
  }),
}))

vi.mock('~/components/issues/PriorityBadge.vue', () => ({
  default: defineComponent({
    name: 'PriorityBadgeStub',
    setup() {
      return () => h('div')
    },
  }),
}))

const issue: Issue = {
  id: 'beads-task-issue-tracker-lnw',
  title: 'Inline edit editor',
  description: 'Original description',
  acceptanceCriteria: '- original criteria',
  type: 'feature',
  status: 'open',
  priority: 'p2',
  labels: [],
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  comments: [],
}

describe('IssuePreview', () => {
  it('shows section content without collapse toggles', () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    const editors = wrapper.findAll('[data-testid="inline-markdown-editor"]')
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Acceptance Criteria')
    expect((editors[0].element as HTMLTextAreaElement).value).toBe('Original description')
    expect((editors[1].element as HTMLTextAreaElement).value).toBe('- original criteria')
    expect(wrapper.findAll('button').some(node => node.text().includes('Description'))).toBe(false)
    expect(wrapper.findAll('button').some(node => node.text().includes('Acceptance Criteria'))).toBe(false)
  })

  it('auto-saves description on blur', async () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    const editor = wrapper.get('[data-testid="inline-markdown-editor"]')
    await editor.setValue('Updated **markdown** description')
    await editor.trigger('blur')
    await nextTick()

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ description: 'Updated **markdown** description' })
  })

  it('auto-saves acceptance criteria on blur', async () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    const editor = wrapper.findAll('[data-testid="inline-markdown-editor"]')[1]!
    await editor.setValue('- updated\n- criteria')
    await editor.trigger('blur')
    await nextTick()

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ acceptanceCriteria: '- updated\n- criteria' })
  })

  it('shows inline editors without edit icon buttons', () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    expect(wrapper.findAll('[data-testid="inline-markdown-editor"]')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Edit description')
    expect(wrapper.text()).not.toContain('Edit acceptance criteria')
  })

  it('renders attachments and comments inside preview with comments tab shown by default', () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    expect(wrapper.get('[data-testid="attachments-section"]').text()).toContain(`attachments:${issue.id}`)
    expect(wrapper.get('[data-testid="comment-section"]').text()).toContain('comments:0')
    expect(wrapper.get('[data-testid="comment-section"]').text()).toContain('embedded:')
    expect(wrapper.get('[data-testid="tab-trigger-comments"]').text()).toContain('Comments (0)')
    expect(wrapper.get('[data-testid="tab-trigger-children"]').text()).toContain('Children (0)')
    expect(wrapper.get('[data-testid="tab-trigger-dependencies"]').text()).toContain('Dependencies (0)')
  })

  it('re-emits add comment from the embedded comment section', async () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    await wrapper.get('[data-testid="comment-section"] button').trigger('click')

    expect(wrapper.emitted('add-comment')?.[0]?.[0]).toBe('Test comment')
  })
})
