import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import IssuesBoardView from '~/components/issues/IssuesBoardView.vue'
import { groupIssuesForBoard } from '~/utils/issue-helpers'
import type { Issue } from '~/types/issue'

vi.mock('~/components/ui/button', () => ({
  Button: defineComponent({
    name: 'ButtonStub',
    emits: ['click'],
    setup(_, { slots, emit, attrs }) {
      return () => h('button', {
        ...attrs,
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
      return () => h('span', `status:${props.status}`)
    },
  }),
}))

vi.mock('~/components/issues/PriorityBadge.vue', () => ({
  default: defineComponent({
    name: 'PriorityBadgeStub',
    props: ['priority'],
    setup(props) {
      return () => h('span', `priority:${props.priority}`)
    },
  }),
}))

vi.mock('~/components/issues/TypeBadge.vue', () => ({
  default: defineComponent({
    name: 'TypeBadgeStub',
    props: ['type'],
    setup(props) {
      return () => h('span', `type:${props.type}`)
    },
  }),
}))

vi.mock('~/components/issues/LabelBadge.vue', () => ({
  default: defineComponent({
    name: 'LabelBadgeStub',
    props: ['label'],
    setup(props) {
      return () => h('span', `label:${props.label}`)
    },
  }),
}))

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    title: 'Test issue',
    description: '',
    type: 'task',
    status: 'open',
    priority: 'p2',
    assignee: '',
    labels: [],
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
    comments: [],
    ...overrides,
  } as Issue
}

describe('IssuesBoardView', () => {
  it('renders visible columns and grouped issues', () => {
    const columns = groupIssuesForBoard([
      makeIssue({ id: 'open-1', title: 'Backlog issue', status: 'open' }),
      makeIssue({ id: 'progress-1', title: 'Working issue', status: 'in_progress' }),
    ])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: [],
        pinnedIds: ['open-1'],
      },
    })

    expect(wrapper.text()).toContain('Backlog')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).toContain('Backlog issue')
    expect(wrapper.text()).toContain('Working issue')
    expect(wrapper.text()).toContain('Pinned')
  })

  it('shows empty state text for visible empty columns', () => {
    const columns = groupIssuesForBoard([makeIssue({ id: 'open-1', status: 'open' })])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: [],
      },
    })

    expect(wrapper.text()).toContain('No issues in in progress.')
    expect(wrapper.text()).toContain('No issues in blocked.')
    expect(wrapper.text()).toContain('No issues in done.')
  })

  it('emits column visibility controls with restore path', async () => {
    const columns = groupIssuesForBoard([makeIssue({ id: 'open-1', status: 'open' })])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: ['blocked'],
      },
    })

    await wrapper.get('button[aria-label="Hide Backlog column"]').trigger('click')
    expect(wrapper.emitted('toggle-column')?.[0]?.[0]).toBe('backlog')

    const restoreButton = wrapper.findAll('button').find(button => button.text() === 'Restore all')
    expect(restoreButton).toBeDefined()
    await restoreButton!.trigger('click')
    expect(wrapper.emitted('restore-columns')).toBeTruthy()
  })

  it('emits a move when an issue is dragged into another column', async () => {
    const columns = groupIssuesForBoard([
      makeIssue({ id: 'open-1', status: 'open' }),
      makeIssue({ id: 'progress-1', status: 'in_progress' }),
    ])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: [],
      },
    })

    const cards = wrapper.findAll('article')
    await cards[0]!.trigger('dragstart')

    const sections = wrapper.findAll('section')
    await sections[1]!.trigger('drop')

    expect(wrapper.emitted('move')?.[0]).toEqual(['open-1', 'in_progress'])
  })
})
