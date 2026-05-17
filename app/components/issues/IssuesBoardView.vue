<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Issue } from '~/types/issue'
import type { BoardColumn, BoardColumnId } from '~/utils/issue-helpers'
import StatusBadge from '~/components/issues/StatusBadge.vue'
import PriorityBadge from '~/components/issues/PriorityBadge.vue'
import TypeBadge from '~/components/issues/TypeBadge.vue'
import LabelBadge from '~/components/issues/LabelBadge.vue'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  columns: BoardColumn[]
  hiddenColumns: BoardColumnId[]
  activeMoveId?: string | null
  pinnedIds?: string[]
}>()

const emit = defineEmits<{
  select: [issue: Issue]
  move: [issueId: string, columnId: BoardColumnId]
  'toggle-column': [columnId: BoardColumnId]
  'restore-columns': []
}>()

const draggingIssueId = ref<string | null>(null)
const dragOverColumnId = ref<BoardColumnId | null>(null)

const visibleColumns = computed(() =>
  props.columns.filter(column => !props.hiddenColumns.includes(column.definition.id)),
)

const hiddenColumnLabels = computed(() =>
  props.columns
    .filter(column => props.hiddenColumns.includes(column.definition.id))
    .map(column => ({ id: column.definition.id, label: column.definition.label })),
)

const pinnedSet = computed(() => new Set(props.pinnedIds ?? []))

const totalVisibleIssues = computed(() =>
  visibleColumns.value.reduce((sum, column) => sum + column.issues.length, 0),
)

const visibleLaneCount = computed(() => visibleColumns.value.length)

const lanesWithWorkCount = computed(() =>
  visibleColumns.value.filter(column => column.issues.length > 0).length,
)

const laneToneMap: Record<BoardColumnId, {
  dot: string
  border: string
  badge: string
  panel: string
  card: string
}> = {
  backlog: {
    dot: 'bg-sky-500',
    border: 'border-sky-500/25',
    badge: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
    panel: 'from-sky-500/10 via-background to-background',
    card: 'hover:border-sky-500/40',
  },
  in_progress: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    panel: 'from-emerald-500/10 via-background to-background',
    card: 'hover:border-emerald-500/40',
  },
  blocked: {
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
    badge: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    panel: 'from-rose-500/10 via-background to-background',
    card: 'hover:border-rose-500/40',
  },
  done: {
    dot: 'bg-violet-500',
    border: 'border-violet-500/25',
    badge: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    panel: 'from-violet-500/10 via-background to-background',
    card: 'hover:border-violet-500/40',
  },
}

const handleDragStart = (issueId: string) => {
  draggingIssueId.value = issueId
}

const clearDragState = () => {
  draggingIssueId.value = null
  dragOverColumnId.value = null
}

const handleDrop = (columnId: BoardColumnId) => {
  if (draggingIssueId.value) {
    emit('move', draggingIssueId.value, columnId)
  }
  clearDragState()
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_24%)]">
    <div class="border-b border-border/70 px-6 py-5">
      <div class="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <span class="h-2 w-2 rounded-full bg-primary/70" />
              Board Workspace
            </div>
            <div class="space-y-2">
              <h2 class="text-2xl font-semibold tracking-tight">Move work with less hunting and less noise</h2>
              <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
                Backlog folds `open`, `deferred`, `pinned`, and `hooked` issues together. `tombstone` issues stay off the board.
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Visible issues</p>
              <p class="mt-2 text-2xl font-semibold">{{ totalVisibleIssues }}</p>
            </div>
            <div class="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Active lanes</p>
              <p class="mt-2 text-2xl font-semibold">{{ lanesWithWorkCount }}/{{ visibleLaneCount }}</p>
            </div>
            <div class="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Hidden lanes</p>
              <p class="mt-2 text-2xl font-semibold">{{ hiddenColumnLabels.length }}</p>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <template v-if="hiddenColumnLabels.length > 0">
            <button
              v-for="column in hiddenColumnLabels"
              :key="column.id"
              class="rounded-full border border-dashed border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              @click="emit('toggle-column', column.id)"
            >
              Show {{ column.label }}
            </button>
            <Button size="sm" variant="outline" class="rounded-full" @click="emit('restore-columns')">
              Restore all
            </Button>
          </template>
          <span v-else class="text-xs text-muted-foreground">
            All lanes are visible.
          </span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <div
        v-if="visibleColumns.length > 0"
        class="grid min-h-full gap-4"
        :class="visibleColumns.length >= 4 ? 'xl:grid-cols-4' : visibleColumns.length === 3 ? 'lg:grid-cols-3' : visibleColumns.length === 2 ? 'md:grid-cols-2' : 'grid-cols-1'"
      >
        <section
          v-for="column in visibleColumns"
          :key="column.definition.id"
          class="flex min-h-[30rem] flex-col overflow-hidden rounded-[1.75rem] border bg-card/85 shadow-sm backdrop-blur"
          :class="[
            laneToneMap[column.definition.id].border,
            `bg-gradient-to-b ${laneToneMap[column.definition.id].panel}`,
            dragOverColumnId === column.definition.id ? 'border-primary/60 ring-2 ring-primary/20' : '',
          ]"
          @dragover.prevent="dragOverColumnId = column.definition.id"
          @dragleave="dragOverColumnId = dragOverColumnId === column.definition.id ? null : dragOverColumnId"
          @drop.prevent="handleDrop(column.definition.id)"
        >
          <header class="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" :class="laneToneMap[column.definition.id].dot" />
                <h3 class="text-sm font-semibold">{{ column.definition.label }}</h3>
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="laneToneMap[column.definition.id].badge"
                >
                  {{ column.count }}
                </span>
              </div>
              <p class="text-xs leading-5 text-muted-foreground">
                {{ column.definition.description }}
              </p>
            </div>

            <button
              class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :aria-label="`Hide ${column.definition.label} column`"
              @click="emit('toggle-column', column.definition.id)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18" />
                <path d="M8 12h13" />
                <path d="M13 18h8" />
              </svg>
            </button>
          </header>

          <div class="flex-1 space-y-3 overflow-y-auto p-4">
            <article
              v-for="issue in column.issues"
              :key="issue.id"
              draggable="true"
              class="group cursor-grab rounded-2xl border border-border/70 bg-background/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              :class="[
                laneToneMap[column.definition.id].card,
                draggingIssueId === issue.id ? 'opacity-50' : '',
                activeMoveId === issue.id ? 'border-primary/60 ring-2 ring-primary/20' : '',
              ]"
              @click="emit('select', issue)"
              @dragstart="handleDragStart(issue.id)"
              @dragend="clearDragState"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="pinnedSet.has(issue.id)"
                      class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                    >
                      Pinned
                    </span>
                    <span class="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{{ issue.id }}</span>
                  </div>
                  <h4 class="line-clamp-2 text-sm font-semibold leading-6 text-foreground">{{ issue.title }}</h4>
                </div>

                <PriorityBadge :priority="issue.priority" />
              </div>

              <p v-if="issue.description" class="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {{ issue.description }}
              </p>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge :status="issue.status" />
                <TypeBadge :type="issue.type" />
                <LabelBadge
                  v-for="label in issue.labels.slice(0, 2)"
                  :key="label"
                  :label="label"
                />
                <span v-if="issue.labels.length > 2" class="text-[11px] text-muted-foreground">
                  +{{ issue.labels.length - 2 }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <div>
                  <p class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Owner</p>
                  <p class="mt-1 truncate font-medium text-foreground/85">{{ issue.assignee || 'Unassigned' }}</p>
                </div>
                <div>
                  <p class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Children</p>
                  <p class="mt-1 font-medium text-foreground/85">{{ issue.children?.length || 0 }}</p>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span>Updated {{ new Date(issue.updatedAt).toLocaleDateString() }}</span>
                <span class="opacity-0 transition-opacity group-hover:opacity-100">Open detail</span>
              </div>
            </article>

            <div
              v-if="column.issues.length === 0"
              class="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 text-center"
            >
              <span class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <span class="h-2.5 w-2.5 rounded-full" :class="laneToneMap[column.definition.id].dot" />
              </span>
              <p class="text-sm font-medium">No issues in {{ column.definition.label.toLowerCase() }}.</p>
              <p class="mt-1 max-w-[16rem] text-xs leading-5 text-muted-foreground">
                Drop a card here or update an issue status to start filling this lane.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center"
      >
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">All columns are hidden</h3>
          <p class="text-sm text-muted-foreground">Restore at least one lane to continue using the board.</p>
          <Button size="sm" class="rounded-full" @click="emit('restore-columns')">
            Restore columns
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
