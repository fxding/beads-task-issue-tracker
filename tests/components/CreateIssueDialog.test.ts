import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import CreateIssueDialog from '~/components/issues/CreateIssueDialog.vue'
import type { CreateIssuePayload } from '~/types/issue'

vi.mock('lucide-vue-next', () => ({
  Check: defineComponent({ name: 'CheckIcon', setup: () => () => h('span') }),
  ChevronRight: defineComponent({ name: 'ChevronRightIcon', setup: () => () => h('span') }),
  X: defineComponent({ name: 'XIcon', setup: () => () => h('span') }),
}))

vi.mock('~/components/ui/button', () => ({
  Button: defineComponent({
    name: 'ButtonStub',
    inheritAttrs: false,
    props: ['type', 'disabled', 'variant', 'size'],
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

vi.mock('~/components/ui/dialog', () => ({
  Dialog: defineComponent({
    name: 'DialogStub',
    props: ['open'],
    emits: ['update:open'],
    setup(props, { slots }) {
      return () => props.open ? h('div', { 'data-testid': 'dialog' }, slots.default?.()) : null
    },
  }),
  DialogContent: defineComponent({
    name: 'DialogContentStub',
    props: ['showCloseButton'],
    setup(_, { slots }) {
      return () => h('section', { 'data-testid': 'dialog-content' }, slots.default?.())
    },
  }),
  DialogFooter: defineComponent({
    name: 'DialogFooterStub',
    setup(_, { slots }) {
      return () => h('footer', slots.default?.())
    },
  }),
  DialogHeader: defineComponent({
    name: 'DialogHeaderStub',
    setup(_, { slots }) {
      return () => h('header', slots.default?.())
    },
  }),
  DialogTitle: defineComponent({
    name: 'DialogTitleStub',
    setup(_, { slots }) {
      return () => h('h2', slots.default?.())
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

vi.mock('~/components/ui/markdown-editor', () => ({
  MarkdownEditor: defineComponent({
    name: 'MarkdownEditorStub',
    inheritAttrs: false,
    props: ['modelValue', 'showStaticToolbar', 'showBubbleToolbar'],
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () => h('textarea', {
        ...attrs,
        'data-testid': 'description',
        'data-show-static-toolbar': String(props.showStaticToolbar),
        'data-show-bubble-toolbar': String(props.showBubbleToolbar),
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
      })
    },
  }),
}))

vi.mock('~/components/ui/select', () => ({
  Select: defineComponent({
    name: 'SelectStub',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () => h('div', { 'data-model-value': props.modelValue }, slots.default?.())
    },
  }),
  SelectContent: defineComponent({
    name: 'SelectContentStub',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  SelectItem: defineComponent({
    name: 'SelectItemStub',
    props: ['value'],
    setup(props, { slots }) {
      return () => h('div', { 'data-value': props.value }, slots.default?.())
    },
  }),
  SelectTrigger: defineComponent({
    name: 'SelectTriggerStub',
    setup(_, { slots }) {
      return () => h('button', { type: 'button' }, slots.default?.())
    },
  }),
  SelectValue: defineComponent({
    name: 'SelectValueStub',
    props: ['placeholder'],
    setup(props) {
      return () => h('span', props.placeholder)
    },
  }),
}))

const mountDialog = (props = {}) => mount(CreateIssueDialog, {
  props: {
    open: true,
    availableEpics: [],
    ...props,
  },
})

describe('CreateIssueDialog', () => {
  it('emits a compact create payload with title and description', async () => {
    const wrapper = mountDialog()

    await wrapper.get('input[aria-label="Issue title"]').setValue('New dialog issue')
    await wrapper.get('[data-testid="description"]').setValue('Dialog body')
    await wrapper.get('form').trigger('submit.prevent')

    const payload = wrapper.emitted('create')?.[0]?.[0] as CreateIssuePayload | undefined
    expect(payload).toEqual({
      title: 'New dialog issue',
      description: 'Dialog body',
      type: 'task',
      priority: 'p3',
      parent: undefined,
    })
  })

  it('does not emit create without a title', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="description"]').setValue('Missing title')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('uses the issue edit view popup formatting toolbar', () => {
    const wrapper = mountDialog()
    const editor = wrapper.get('[data-testid="description"]')

    expect(editor.attributes('data-show-static-toolbar')).toBe('false')
    expect(editor.attributes('data-show-bubble-toolbar')).toBe('true')
  })

  it('seeds the parent from defaultParent', async () => {
    const wrapper = mountDialog({
      defaultParent: 'epic-1',
      availableEpics: [{ id: 'epic-1', title: 'Parent epic' }],
    })

    await wrapper.get('input[aria-label="Issue title"]').setValue('Child issue')
    await wrapper.get('form').trigger('submit.prevent')

    const payload = wrapper.emitted('create')?.[0]?.[0] as CreateIssuePayload | undefined
    expect(payload?.parent).toBe('epic-1')
  })

  it('emits close when cancel is clicked', async () => {
    const wrapper = mountDialog()

    await wrapper.findAll('button').find(button => button.text() === 'Cancel')!.trigger('click')

    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
