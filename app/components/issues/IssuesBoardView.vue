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
  <div class="flex h-full flex-col overflow-hidden">
    <div class="border-b border-border px-6 py-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-[0.25em] text-muted-foreground">Issues Board</p>
          <h2 class="text-xl font-semibold">Plan and move work across explicit lanes</h2>
          <p class="max-w-2xl text-sm text-muted-foreground">
            Backlog folds `open`, `deferred`, `pinned`, and `hooked` issues together. `tombstone` issues stay off the board.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <template v-if="hiddenColumnLabels.length > 0">
            <button
              v-for="column in hiddenColumnLabels"
              :key="column.id"
              class="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              @click="emit('toggle-column', column.id)"
            >
              Show {{ column.label }}
            </button>
            <Button size="sm" variant="outline" @click="emit('restore-columns')">
              Restore all
            </Button>
          </template>
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
          class="flex min-h-[28rem] flex-col rounded-2xl border border-border bg-card/80 shadow-sm"
          :class="dragOverColumnId === column.definition.id ? 'border-primary/60 ring-2 ring-primary/20' : ''"
          @dragover.prevent="dragOverColumnId = column.definition.id"
          @dragleave="dragOverColumnId = dragOverColumnId === column.definition.id ? null : dragOverColumnId"
          @drop.prevent="handleDrop(column.definition.id)"
        >
          <header class="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold">{{ column.definition.label }}</h3>
                <span class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
              class="cursor-grab rounded-xl border border-border bg-background/80 p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow"
              :class="[
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
                      class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
                    >
                      Pinned
                    </span>
                    <span class="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{{ issue.id }}</span>
                  </div>
                  <h4 class="line-clamp-2 text-sm font-semibold text-foreground">{{ issue.title }}</h4>
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

              <div class="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{{ issue.assignee || 'Unassigned' }}</span>
                <span>{{ issue.children?.length || 0 }} child{{ issue.children?.length === 1 ? '' : 'ren' }}</span>
              </div>
            </article>

            <div
              v-if="column.issues.length === 0"
              class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground"
            >
              No issues in {{ column.definition.label.toLowerCase() }}.
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="flex h-full min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center"
      >
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">All columns are hidden</h3>
          <p class="text-sm text-muted-foreground">Restore at least one lane to continue using the board.</p>
          <Button size="sm" @click="emit('restore-columns')">
            Restore columns
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
