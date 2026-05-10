import { describe, expect, it, vi, beforeEach } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import IssueForm from '~/components/details/IssueForm.vue'
import type { UpdateIssuePayload } from '~/types/issue'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

vi.mock('~/components/ui/button', () => ({
  Button: defineComponent({
    name: 'ButtonStub',
    props: ['type', 'disabled'],
    emits: ['click'],
    setup(props, { slots, emit }) {
      return () => h('button', {
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
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () => h('input', {
        ...attrs,
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
      })
    },
  }),
}))

vi.mock('~/components/ui/textarea', () => ({
  Textarea: defineComponent({
    name: 'TextareaStub',
    inheritAttrs: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () => h('textarea', {
        ...attrs,
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      })
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
        'data-testid': 'markdown-editor',
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      })
    },
  }),
}))

vi.mock('~/components/ui/label', () => ({
  Label: defineComponent({
    name: 'LabelStub',
    setup(_, { slots }) {
      return () => h('label', slots.default?.())
    },
  }),
}))

vi.mock('~/components/ui/scroll-area', () => ({
  ScrollArea: defineComponent({
    name: 'ScrollAreaStub',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
}))

vi.mock('~/components/ui/select', () => {
  const passthrough = (name: string) => defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  })

  return {
    Select: passthrough('SelectStub'),
    SelectContent: passthrough('SelectContentStub'),
    SelectItem: passthrough('SelectItemStub'),
    SelectTrigger: passthrough('SelectTriggerStub'),
    SelectValue: passthrough('SelectValueStub'),
  }
})

vi.mock('~/components/ui/label-multiselect', () => ({
  LabelMultiSelect: defineComponent({
    name: 'LabelMultiSelectStub',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
}))

const beadsState = reactive({ value: '/tmp/beads' })

vi.stubGlobal('useBeadsPath', () => ({
  beadsPath: beadsState,
}))

vi.stubGlobal('useNotification', () => ({
  notify: vi.fn(),
}))

describe('IssueForm', () => {
  beforeEach(() => {
    beadsState.value = '/tmp/beads'
  })

  it('emits markdown description content on save', async () => {
    const wrapper = mount(IssueForm, {
      props: {
        isNew: true,
        availableLabels: [],
        availableEpics: [],
      },
    })

    await wrapper.get('#title').setValue('Align editor')
    await wrapper.get('[data-testid="markdown-editor"]').setValue('**bold**\n\n- item')
    await wrapper.get('form').trigger('submit.prevent')
    await nextTick()

    const payload = wrapper.emitted('save')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toBeTruthy()
    if (!payload) throw new Error('Expected save payload to be emitted')
    expect(payload.title).toBe('Align editor')
    expect(payload.description).toBe('**bold**\n\n- item')
  })
})
