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
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () => h('textarea', {
        ...attrs,
        'data-testid': 'inline-markdown-editor',
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      })
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

    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Original description')
    expect(wrapper.text()).toContain('Acceptance Criteria')
    expect(wrapper.text()).toContain('- original criteria')
    expect(wrapper.findAll('button').some(node => node.text().includes('Description'))).toBe(false)
    expect(wrapper.findAll('button').some(node => node.text().includes('Acceptance Criteria'))).toBe(false)
  })

  it('emits inline description updates', async () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    await wrapper.get('[aria-label="Edit description"]').trigger('click')
    const editor = wrapper.get('[data-testid="inline-markdown-editor"]')
    await editor.setValue('Updated **markdown** description')
    await wrapper.get('[aria-label="Save description"]').trigger('click')
    await nextTick()

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ description: 'Updated **markdown** description' })
  })

  it('emits inline acceptance criteria updates', async () => {
    const wrapper = mount(IssuePreview, {
      props: {
        issue,
        readonly: false,
        availableIssues: [],
      },
    })

    await wrapper.get('[aria-label="Edit acceptance criteria"]').trigger('click')
    const editor = wrapper.get('[data-testid="inline-markdown-editor"]')
    await editor.setValue('- updated\n- criteria')
    await wrapper.get('[aria-label="Save acceptance criteria"]').trigger('click')
    await nextTick()

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ acceptanceCriteria: '- updated\n- criteria' })
  })
})
