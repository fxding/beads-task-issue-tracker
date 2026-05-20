import { BeadsClient } from '@herbcaudill/beads-sdk'
import type {
  CreateInput,
  Issue,
  ListFilter,
  Priority,
  ReadyFilter,
  Status,
  UpdateInput,
} from '@herbcaudill/beads-sdk'

export interface BdExecutorOptions {
  args?: string[]
  cwd?: string
}

export interface BdResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

type BdIssueWithCliAliases = Issue & {
  owner?: string
  blocked_by?: string[]
  blocks?: string[]
  estimate?: number
}

/**
 * Unwrap the paginated envelope returned by br >= 0.1.30 for `list` commands.
 * br list --json returns {"issues": [...], "total": N, ...} instead of a flat array.
 * Other commands (show, ready, search) still return flat arrays.
 */
export function unwrapBrEnvelope<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[]
  }
  if (data && typeof data === 'object' && 'issues' in data) {
    const envelope = data as { issues: unknown[] }
    if (Array.isArray(envelope.issues)) {
      return envelope.issues as T[]
    }
  }
  return []
}

function getWorkingDir(cwd?: string): string {
  return cwd || process.env.BEADS_PATH || process.cwd()
}

async function withBdClient<T>(
  cwd: string | undefined,
  operation: (client: BeadsClient) => Promise<T>
): Promise<BdResult<T>> {
  const workingDir = getWorkingDir(cwd)
  const client = new BeadsClient({ actor: 'beads-task-issue-tracker' })

  try {
    await client.connect(workingDir)
    const data = await operation(client)
    return {
      success: true,
      data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: errorMessage,
    }
  } finally {
    await client.disconnect().catch(() => {})
  }
}

function normalizePriority(priority: string | number): Priority {
  const parsed = typeof priority === 'number' ? priority : Number.parseInt(priority, 10)
  return [0, 1, 2, 3, 4].includes(parsed) ? (parsed as Priority) : 3
}

function normalizeIssue(issue: Issue): BdIssueWithCliAliases {
  const blockedBy = issue.dependencies
    ?.filter(dep => dep.dependency_type === 'blocks')
    .map(dep => dep.id)
  const blocks = issue.dependents
    ?.filter(dep => dep.dependency_type === 'blocks')
    .map(dep => dep.id)

  return {
    ...issue,
    owner: issue.owner || issue.assignee,
    blocked_by: blockedBy,
    blocks,
  }
}

function normalizeIssues(issues: Issue[]): BdIssueWithCliAliases[] {
  return issues.map(normalizeIssue)
}

function toListFilter(filters?: {
  status?: string[]
  type?: string[]
  priority?: string[]
  assignee?: string
  includeAll?: boolean
}): ListFilter {
  const filter: ListFilter = {
    limit: filters?.includeAll ? 10000 : 50,
  }

  if (filters?.status?.length === 1 && filters.status[0]) {
    filter.status = filters.status[0] as Status
  }
  if (filters?.type?.length === 1 && filters.type[0]) {
    filter.issue_type = filters.type[0]
  }
  if (filters?.priority?.length === 1 && filters.priority[0]) {
    filter.priority = normalizePriority(filters.priority[0])
  }
  if (filters?.assignee) {
    filter.assignee = filters.assignee
  }

  return filter
}

function applyClientSideListFilters(
  issues: Issue[],
  filters?: {
    status?: string[]
    type?: string[]
    priority?: string[]
    assignee?: string
    includeAll?: boolean
  }
): Issue[] {
  return issues.filter((issue) => {
    if (filters?.status?.length && !filters.status.includes(issue.status)) {
      return false
    }
    if (filters?.type?.length && !filters.type.includes(issue.issue_type)) {
      return false
    }
    if (
      filters?.priority?.length
      && !filters.priority.map(normalizePriority).includes(issue.priority)
    ) {
      return false
    }
    if (filters?.assignee && issue.assignee !== filters.assignee && issue.owner !== filters.assignee) {
      return false
    }
    if (!filters?.includeAll && issue.status === 'closed') {
      return false
    }
    return true
  })
}

function toCreateInput(
  title: string,
  options?: {
    description?: string
    type?: string
    priority?: string
    assignee?: string
    labels?: string[]
    externalRef?: string
    estimate?: number
    design?: string
    acceptance?: string
    notes?: string
  }
): CreateInput {
  const input: CreateInput = {
    title,
  }

  if (options?.description !== undefined) input.description = options.description
  if (options?.type !== undefined) input.issue_type = options.type
  if (options?.priority !== undefined) input.priority = normalizePriority(options.priority)
  if (options?.assignee !== undefined) input.assignee = options.assignee
  if (options?.labels !== undefined) input.labels = options.labels
  if (options?.design !== undefined) input.design = options.design
  if (options?.acceptance !== undefined) input.acceptance_criteria = options.acceptance

  return input
}

function toUpdateInput(updates: {
  title?: string
  description?: string
  type?: string
  status?: string
  priority?: string
  assignee?: string
  labels?: string[]
  externalRef?: string
  estimate?: number
  design?: string
  acceptance?: string
  notes?: string
}): UpdateInput {
  const input: UpdateInput = {}

  if (updates.title !== undefined) input.title = updates.title
  if (updates.description !== undefined) input.description = updates.description
  if (updates.type !== undefined) input.issue_type = updates.type
  if (updates.status !== undefined) input.status = updates.status
  if (updates.priority !== undefined) input.priority = normalizePriority(updates.priority)
  if (updates.assignee !== undefined) input.assignee = updates.assignee
  if (updates.labels !== undefined) input.add_labels = updates.labels
  if (updates.design !== undefined) input.design = updates.design
  if (updates.acceptance !== undefined) input.acceptance_criteria = updates.acceptance
  if (updates.notes !== undefined) input.notes = updates.notes

  return input
}

/**
 * Execute a bd operation and return JSON-compatible output.
 * Kept for compatibility with older call sites; new code should prefer the typed helpers below.
 */
export async function executeBd<T = unknown>(
  command: string,
  options: BdExecutorOptions = {}
): Promise<BdResult<T>> {
  switch (command) {
    case 'list':
      return bdList({}, options.cwd) as Promise<BdResult<T>>
    case 'ready':
      return bdReady(options.cwd) as Promise<BdResult<T>>
    case 'status':
      return bdStatus(options.cwd) as Promise<BdResult<T>>
    case 'count':
      return bdCount(options.cwd) as Promise<BdResult<T>>
    case 'show':
      if (!options.args?.[0]) return { success: false, error: 'Issue ID is required' }
      return bdShow(options.args[0], options.cwd) as Promise<BdResult<T>>
    case 'close':
      if (!options.args?.[0]) return { success: false, error: 'Issue ID is required' }
      return bdClose(options.args[0], options.cwd) as Promise<BdResult<T>>
    case 'delete':
      if (!options.args?.[0]) return { success: false, error: 'Issue ID is required' }
      return bdDelete(options.args[0], options.cwd) as Promise<BdResult<T>>
    default:
      return {
        success: false,
        error: `Unsupported SDK operation: ${command}`,
      }
  }
}

/**
 * Execute bd list command with optional filters
 */
export async function bdList(
  filters?: {
    status?: string[]
    type?: string[]
    priority?: string[]
    assignee?: string
    includeAll?: boolean
  },
  cwd?: string
) {
  return withBdClient(cwd, async (client) => {
    const issues = await client.list(toListFilter(filters))
    return normalizeIssues(applyClientSideListFilters(issues, filters))
  })
}

/**
 * Execute bd show command
 */
export async function bdShow(id: string, cwd?: string) {
  return withBdClient(cwd, async client => normalizeIssue(await client.show(id)))
}

/**
 * Execute bd create command
 */
export async function bdCreate(
  title: string,
  options?: {
    description?: string
    type?: string
    priority?: string
    assignee?: string
    labels?: string[]
    externalRef?: string
    estimate?: number
    design?: string
    acceptance?: string
    notes?: string
  },
  cwd?: string
) {
  return withBdClient(cwd, async client => normalizeIssue(await client.create(toCreateInput(title, options))))
}

/**
 * Execute bd update command
 */
export async function bdUpdate(
  id: string,
  updates: {
    title?: string
    description?: string
    type?: string
    status?: string
    priority?: string
    assignee?: string
    labels?: string[]
    externalRef?: string
    estimate?: number
    design?: string
    acceptance?: string
    notes?: string
  },
  cwd?: string
) {
  return withBdClient(cwd, async client => normalizeIssue(await client.update(id, toUpdateInput(updates))))
}

/**
 * Execute bd close command
 */
export async function bdClose(id: string, cwd?: string) {
  return withBdClient(cwd, async client => normalizeIssue(await client.close(id)))
}

/**
 * Execute bd status command (dashboard stats)
 */
export async function bdStatus(cwd?: string) {
  return withBdClient(cwd, async client => client.stats())
}

/**
 * Execute bd count command (grouped counts)
 */
export async function bdCount(cwd?: string) {
  return bdList({}, cwd)
}

/**
 * Execute bd ready command (available work)
 */
export async function bdReady(cwd?: string) {
  const filter: ReadyFilter = { limit: 10000 }
  return withBdClient(cwd, async client => normalizeIssues(await client.ready(filter)))
}

/**
 * Execute bd delete command
 */
export async function bdDelete(id: string, cwd?: string) {
  return withBdClient(cwd, async (client) => {
    await client.delete(id)
    return { success: true, id }
  })
}

/**
 * Execute bd comments add command
 */
export async function bdCommentsAdd(id: string, content: string, cwd?: string) {
  return withBdClient(cwd, async (client) => {
    await client.addComment(id, content)
    return { success: true }
  })
}
