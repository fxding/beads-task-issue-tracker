import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import IssueDetailHeader from '~/components/details/IssueDetailHeader.vue'
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

vi.mock('~/components/ui/input', () => ({
  Input: defineComponent({
    name: 'InputStub',
    inheritAttrs: false,
    props: ['modelValue', 'readonly'],
    emits: ['update:modelValue', 'keydown'],
    setup(props, { emit, attrs }) {
      return () => h('input', {
        ...attrs,
        value: props.modelValue,
        readonly: props.readonly,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        onKeydown: (event: KeyboardEvent) => emit('keydown', event),
      })
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

describe('IssueDetailHeader', () => {
  it('emits title save only after the title changes', async () => {
    const wrapper = mount(IssueDetailHeader, {
      props: {
        selectedIssue: issue,
        readonly: false,
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.get('[aria-label="Issue title"]').setValue('Ship inline editing')

    const saveButton = wrapper.findAll('button').find(node => node.text() === 'Save title')
    expect(saveButton).toBeTruthy()
    await saveButton!.trigger('click')

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ title: 'Ship inline editing' })
  })

  it('resets title edits when requested', async () => {
    const wrapper = mount(IssueDetailHeader, {
      props: {
        selectedIssue: issue,
        readonly: false,
      },
    })

    const input = wrapper.get('[aria-label="Issue title"]')
    await input.setValue('Temporary title')

    const resetButton = wrapper.findAll('button').find(node => node.text() === 'Reset')
    expect(resetButton).toBeTruthy()
    await resetButton!.trigger('click')

    expect((wrapper.get('[aria-label="Issue title"]').element as HTMLInputElement).value).toBe(issue.title)
    expect(wrapper.emitted('save-inline')).toBeUndefined()
  })
})
