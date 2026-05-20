import { beforeEach, describe, expect, it, vi } from 'vitest'

const connectMock = vi.fn()
const disconnectMock = vi.fn()
const updateMock = vi.fn()

vi.mock('@herbcaudill/beads-sdk', () => {
  return {
    BeadsClient: vi.fn(function BeadsClient() {
      return {
        connect: connectMock,
        disconnect: disconnectMock,
        update: updateMock,
      }
    }),
  }
})

const { bdUpdate, unwrapBrEnvelope } = await import('../../server/utils/bd-executor')

describe('unwrapBrEnvelope', () => {
  const sampleIssues = [
    { id: 'abc-123', title: 'Bug', status: 'open', priority: 2, issue_type: 'bug' },
    { id: 'def-456', title: 'Task', status: 'closed', priority: 3, issue_type: 'task' },
  ]

  it('returns flat array as-is (bd / br < 0.1.30)', () => {
    const result = unwrapBrEnvelope(sampleIssues)
    expect(result).toEqual(sampleIssues)
  })

  it('unwraps paginated envelope (br >= 0.1.30)', () => {
    const envelope = {
      issues: sampleIssues,
      total: 2,
      offset: 0,
      limit: 50,
      has_more: false,
    }
    const result = unwrapBrEnvelope(envelope)
    expect(result).toEqual(sampleIssues)
  })

  it('returns empty array for null/undefined', () => {
    expect(unwrapBrEnvelope(null)).toEqual([])
    expect(unwrapBrEnvelope(undefined)).toEqual([])
  })

  it('returns empty array for non-array, non-envelope object', () => {
    expect(unwrapBrEnvelope({ error: 'something' })).toEqual([])
    expect(unwrapBrEnvelope('string data')).toEqual([])
  })

  it('returns empty array when envelope.issues is not an array', () => {
    expect(unwrapBrEnvelope({ issues: 'not an array' })).toEqual([])
    expect(unwrapBrEnvelope({ issues: null })).toEqual([])
  })

  it('handles empty issues array in envelope', () => {
    const envelope = { issues: [], total: 0, offset: 0, limit: 50, has_more: false }
    expect(unwrapBrEnvelope(envelope)).toEqual([])
  })

  it('handles empty flat array', () => {
    expect(unwrapBrEnvelope([])).toEqual([])
  })

  it('handles real br ready output (flat array, fewer fields)', () => {
    // br ready returns a flat array with a subset of fields
    const readyIssues = [
      {
        created_at: '2025-06-15T09:30:00Z',
        description: 'Some bug description',
        id: 'proj-abc',
        issue_type: 'bug',
        priority: 1,
        status: 'open',
        title: 'Example ready issue',
        updated_at: '2025-06-15T10:45:00Z',
      },
    ]
    const result = unwrapBrEnvelope(readyIssues)
    expect(result).toEqual(readyIssues)
    expect(result).toHaveLength(1)
  })

  it('handles real br list envelope (extra pagination fields)', () => {
    // br list --json returns paginated envelope with extra fields
    const envelope = {
      issues: [
        {
          id: 'proj-abc',
          title: 'Example bug',
          description: 'A test description',
          status: 'open',
          priority: 2,
          issue_type: 'bug',
          created_at: '2025-06-15T09:30:00Z',
          updated_at: '2025-06-15T10:45:00Z',
          source_repo: '.',
          compaction_level: 0,
          dependency_count: 0,
          dependent_count: 0,
        },
      ],
      total: 136,
      limit: 1,
      offset: 0,
      has_more: true,
    }
    const result = unwrapBrEnvelope(envelope)
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('id', 'proj-abc')
  })
})

describe('bdUpdate', () => {
  beforeEach(() => {
    connectMock.mockReset()
    disconnectMock.mockReset()
    updateMock.mockReset()
    connectMock.mockResolvedValue(undefined)
    disconnectMock.mockResolvedValue(undefined)
    updateMock.mockResolvedValue({
      id: 'beads-task-issue-tracker-kya',
      title: 'Keep title only',
      description: '',
      status: 'open',
      priority: 2,
      issue_type: 'task',
      labels: [],
      created_at: '2025-06-15T09:30:00Z',
      updated_at: '2025-06-15T10:45:00Z',
      dependency_count: 0,
      dependent_count: 0,
      dependencies: [],
      dependents: [],
    })
  })

  it('forwards empty acceptance criteria so beads-sdk can clear the field', async () => {
    const result = await bdUpdate('beads-task-issue-tracker-kya', { acceptance: '' }, '/tmp/project')

    expect(result.success).toBe(true)
    expect(connectMock).toHaveBeenCalledWith('/tmp/project')
    expect(updateMock).toHaveBeenCalledWith('beads-task-issue-tracker-kya', {
      acceptance_criteria: '',
    })
    expect(disconnectMock).toHaveBeenCalledTimes(1)
  })

  it('still omits acceptance criteria when the field is not present', async () => {
    await bdUpdate('beads-task-issue-tracker-kya', { title: 'Keep title only' }, '/tmp/project')

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(updateMock.mock.calls[0]?.[1]).toMatchObject({ title: 'Keep title only' })
    expect(updateMock.mock.calls[0]?.[1]).not.toHaveProperty('acceptance_criteria')
  })
})
