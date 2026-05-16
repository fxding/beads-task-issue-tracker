import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import IssuePropertiesPanel from '~/components/details/IssuePropertiesPanel.vue'
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

vi.mock('~/components/issues/StatusBadge.vue', () => ({
  default: defineComponent({
    name: 'StatusBadgeStub',
    props: ['status'],
    setup(props) {
      return () => h('span', { 'data-testid': 'status-badge' }, props.status)
    },
  }),
}))

vi.mock('~/components/issues/PriorityBadge.vue', () => ({
  default: defineComponent({
    name: 'PriorityBadgeStub',
    props: ['priority'],
    setup(props) {
      return () => h('span', props.priority)
    },
  }),
}))

vi.mock('~/components/issues/LabelBadge.vue', () => ({
  default: defineComponent({
    name: 'LabelBadgeStub',
    props: ['label'],
    setup(props) {
      return () => h('span', props.label)
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

vi.mock('~/components/ui/dropdown-menu', () => ({
  DropdownMenu: defineComponent({
    name: 'DropdownMenuStub',
    props: ['open', 'modal'],
    emits: ['update:open'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  DropdownMenuTrigger: defineComponent({
    name: 'DropdownMenuTriggerStub',
    props: ['asChild', 'disabled'],
    setup(props, { slots }) {
      return () => h('div', { 'data-disabled': String(Boolean(props.disabled)) }, slots.default?.())
    },
  }),
  DropdownMenuContent: defineComponent({
    name: 'DropdownMenuContentStub',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  DropdownMenuItem: defineComponent({
    name: 'DropdownMenuItemStub',
    emits: ['select'],
    setup(_, { slots, emit }) {
      return () => h('button', { onClick: () => emit('select') }, slots.default?.())
    },
  }),
  DropdownMenuSeparator: defineComponent({
    name: 'DropdownMenuSeparatorStub',
    setup() {
      return () => h('hr')
    },
  }),
  DropdownMenuCheckboxItem: defineComponent({
    name: 'DropdownMenuCheckboxItemStub',
    props: ['checked'],
    emits: ['select'],
    setup(_, { slots, emit }) {
      return () => h('button', { onClick: () => emit('select') }, slots.default?.())
    },
  }),
  DropdownMenuRadioGroup: defineComponent({
    name: 'DropdownMenuRadioGroupStub',
    props: ['modelValue'],
    emits: ['update:model-value'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  DropdownMenuRadioItem: defineComponent({
    name: 'DropdownMenuRadioItemStub',
    props: ['value'],
    setup(props, { slots, attrs }) {
      return () => h('button', { ...attrs, 'data-value': props.value }, slots.default?.())
    },
  }),
}))

const issue: Issue = {
  id: 'beads-task-issue-tracker-4da',
  title: 'Closed issue status edits',
  description: 'Original description',
  acceptanceCriteria: '',
  type: 'bug',
  status: 'closed',
  priority: 'p2',
  labels: [],
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  comments: [],
}

describe('IssuePropertiesPanel', () => {
  it('keeps the status control enabled for closed issues even when the panel is readonly', () => {
    const wrapper = mount(IssuePropertiesPanel, {
      props: {
        issue,
        readonly: true,
      },
    })

    const statusTrigger = wrapper.findAllComponents({ name: 'DropdownMenuTriggerStub' })[0]
    expect(statusTrigger.attributes('data-disabled')).toBe('false')
  })

  it('emits a status update from a closed issue while readonly', async () => {
    const wrapper = mount(IssuePropertiesPanel, {
      props: {
        issue,
        readonly: true,
      },
    })

    const statusGroup = wrapper.findComponent({ name: 'DropdownMenuRadioGroupStub' })
    await statusGroup.vm.$emit('update:model-value', 'open')

    const payload = wrapper.emitted('save-inline')?.[0]?.[0] as UpdateIssuePayload | undefined
    expect(payload).toEqual({ status: 'open' })
  })

  it('keeps non-status controls disabled when the panel is readonly', () => {
    const wrapper = mount(IssuePropertiesPanel, {
      props: {
        issue,
        readonly: true,
        availableAssignees: ['alice'],
      },
    })

    const triggers = wrapper.findAllComponents({ name: 'DropdownMenuTriggerStub' })
    expect(triggers[1]?.attributes('data-disabled')).toBe('true')
  })
})
