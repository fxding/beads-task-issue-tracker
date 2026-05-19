import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
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

  it('renders empty columns when they are not hidden', () => {
    const columns = groupIssuesForBoard([makeIssue({ id: 'open-1', status: 'open' })])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: [],
      },
    })

    expect(wrapper.text()).toContain('Backlog')
    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).toContain('Blocked')
    expect(wrapper.text()).toContain('Done')
    expect(wrapper.text()).toContain('No issues')
  })

  it('shows an empty lane after it is toggled visible', async () => {
    const columns = groupIssuesForBoard([makeIssue({ id: 'open-1', status: 'open' })])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: ['in_progress', 'blocked', 'done'],
      },
    })

    expect(wrapper.text()).toContain('Show In Progress')

    await wrapper.setProps({
      hiddenColumns: ['blocked', 'done'],
    })

    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.findAll('section')).toHaveLength(2)
    expect(wrapper.find('button[aria-label="Hide In Progress column"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Show In Progress')
  })

  it('shows a manually hidden lane through restore controls even when it has issues', () => {
    const columns = groupIssuesForBoard([
      makeIssue({ id: 'open-1', status: 'open' }),
      makeIssue({ id: 'progress-1', status: 'in_progress' }),
    ])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: ['in_progress'],
      },
    })

    expect(wrapper.text()).not.toContain('Working issue')
    expect(wrapper.text()).toContain('Show In Progress')
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

  it('animates moved cards and displaced lane neighbors smoothly', async () => {
    const animate = vi.fn()
    const cancel = vi.fn()
    const rects = new Map<string, DOMRect>([
      ['open-1', { left: 10, top: 20 } as DOMRect],
      ['open-2', { left: 10, top: 80 } as DOMRect],
      ['progress-1', { left: 360, top: 20 } as DOMRect],
    ])
    const columns = groupIssuesForBoard([
      makeIssue({ id: 'open-1', title: 'Moved issue', status: 'open' }),
      makeIssue({ id: 'open-2', title: 'Neighbor issue', status: 'open' }),
      makeIssue({ id: 'progress-1', title: 'Working issue', status: 'in_progress' }),
    ])

    const wrapper = mount(IssuesBoardView, {
      props: {
        columns,
        hiddenColumns: [],
      },
      attachTo: document.body,
    })

    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    const originalGetAnimations = HTMLElement.prototype.getAnimations
    const originalAnimate = HTMLElement.prototype.animate

    HTMLElement.prototype.getBoundingClientRect = function () {
      const issueId = this.dataset?.issueId
      return rects.get(issueId!) ?? ({ left: 0, top: 0 } as DOMRect)
    }
    HTMLElement.prototype.getAnimations = vi.fn(() => [{ cancel } as unknown as Animation])
    HTMLElement.prototype.animate = animate

    await nextTick()
    await nextTick()
    animate.mockClear()
    cancel.mockClear()

    rects.set('open-1', { left: 360, top: 80 } as DOMRect)
    rects.set('open-2', { left: 10, top: 20 } as DOMRect)
    rects.set('progress-1', { left: 360, top: 20 } as DOMRect)

    await wrapper.setProps({
      columns: groupIssuesForBoard([
        makeIssue({ id: 'open-1', title: 'Moved issue', status: 'in_progress' }),
        makeIssue({ id: 'open-2', title: 'Neighbor issue', status: 'open' }),
        makeIssue({ id: 'progress-1', title: 'Working issue', status: 'in_progress' }),
      ]),
    })
    await nextTick()

    expect(animate).toHaveBeenCalledTimes(2)
    expect(cancel).toHaveBeenCalledTimes(2)
    const animatedIds = animate.mock.instances.map(instance => (instance as HTMLElement).dataset.issueId)
    const movedCardAnimationIndex = animatedIds.indexOf('open-1')
    expect(animatedIds).toEqual(['open-2', 'open-1'])
    expect(animate.mock.calls[movedCardAnimationIndex]?.[0]).toEqual([
      {
        transform: 'translate3d(-350px, -60px, 0)',
        offset: 0,
      },
      {
        transform: 'translate3d(-63px, -10.799999999999999px, 0)',
        offset: 0.72,
      },
      {
        transform: 'translate3d(0, 0, 0)',
        offset: 1,
      },
    ])
    expect(animate.mock.calls[movedCardAnimationIndex]?.[1]).toMatchObject({
      duration: 340,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'both',
    })

    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    HTMLElement.prototype.getAnimations = originalGetAnimations
    HTMLElement.prototype.animate = originalAnimate
    wrapper.unmount()
  })
})
