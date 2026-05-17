<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Issue } from '~/types/issue'
import type { BoardColumn, BoardColumnId } from '~/utils/issue-helpers'
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
  card: string
}> = {
  backlog: {
    dot: 'bg-sky-500',
    border: 'border-sky-500/20',
    card: 'hover:border-sky-500/30',
  },
  in_progress: {
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20',
    card: 'hover:border-emerald-500/30',
  },
  blocked: {
    dot: 'bg-rose-500',
    border: 'border-rose-500/20',
    card: 'hover:border-rose-500/30',
  },
  done: {
    dot: 'bg-violet-500',
    border: 'border-violet-500/20',
    card: 'hover:border-violet-500/30',
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
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <div class="border-b border-border/60 px-6 py-4">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">Board</h2>
          <p class="text-sm text-muted-foreground">
            {{ totalVisibleIssues }} issues across {{ visibleLaneCount }} visible lanes.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span class="rounded-full border border-border bg-muted/40 px-3 py-1">
            {{ lanesWithWorkCount }} active
          </span>
          <template v-if="hiddenColumnLabels.length > 0">
            <button
              v-for="column in hiddenColumnLabels"
              :key="column.id"
              class="rounded-full border border-dashed border-border px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-foreground"
              @click="emit('toggle-column', column.id)"
            >
              Show {{ column.label }}
            </button>
            <Button size="sm" variant="outline" class="h-8 rounded-full px-3" @click="emit('restore-columns')">
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
          class="flex min-h-[30rem] flex-col rounded-2xl border bg-muted/20"
          :class="[
            laneToneMap[column.definition.id].border,
            dragOverColumnId === column.definition.id ? 'border-primary/60 ring-2 ring-primary/20' : '',
          ]"
          @dragover.prevent="dragOverColumnId = column.definition.id"
          @dragleave="dragOverColumnId = dragOverColumnId === column.definition.id ? null : dragOverColumnId"
          @drop.prevent="handleDrop(column.definition.id)"
        >
          <header class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" :class="laneToneMap[column.definition.id].dot" />
              <h3 class="text-sm font-semibold">{{ column.definition.label }}</h3>
              <span class="text-sm text-muted-foreground">{{ column.count }}</span>
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

          <div class="flex-1 space-y-3 overflow-y-auto px-2 pb-2">
            <article
              v-for="issue in column.issues"
              :key="issue.id"
              draggable="true"
              class="group cursor-grab rounded-xl border border-border/70 bg-background p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:shadow-sm"
              :class="[
                laneToneMap[column.definition.id].card,
                draggingIssueId === issue.id ? 'opacity-50' : '',
                activeMoveId === issue.id ? 'border-primary/60 ring-2 ring-primary/20' : '',
              ]"
              @click="emit('select', issue)"
              @dragstart="handleDragStart(issue.id)"
              @dragend="clearDragState"
            >
              <div class="min-w-0 space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <span class="font-mono text-xs text-muted-foreground">{{ issue.id }}</span>
                  <span
                    v-if="pinnedSet.has(issue.id)"
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                  >
                    Pinned
                  </span>
                </div>
                <h4 class="line-clamp-2 text-sm font-medium leading-5 text-foreground">{{ issue.title }}</h4>
              </div>

              <p v-if="issue.description" class="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {{ issue.description }}
              </p>

              <div v-if="issue.labels.length > 0" class="mt-3 flex flex-wrap items-center gap-1.5">
                <LabelBadge
                  v-for="label in issue.labels.slice(0, 1)"
                  :key="label"
                  :label="label"
                />
                <span v-if="issue.labels.length > 1" class="text-[11px] text-muted-foreground">
                  +{{ issue.labels.length - 1 }}
                </span>
              </div>

              <div class="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{{ issue.assignee || 'Unassigned' }}</span>
                <span v-if="issue.children?.length" class="text-muted-foreground/70">· {{ issue.children.length }} sub</span>
              </div>
            </article>

            <div
              v-if="column.issues.length === 0"
              class="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/60 px-4 text-center"
            >
              <p class="text-sm text-muted-foreground">No issues</p>
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
