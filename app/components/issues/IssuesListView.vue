<script setup lang="ts">
import type { Issue } from '~/types/issue'
import type { PinnedSortMode } from '~/composables/usePinnedIssues'
import QuickList from '~/components/dashboard/QuickList.vue'
import PinnedList from '~/components/dashboard/PinnedList.vue'

defineProps<{
  readyIssues: Issue[]
  inProgressIssues: Issue[]
  pinnedIssues: Issue[]
  pinnedSortMode: PinnedSortMode
}>()

const emit = defineEmits<{
  select: [issue: Issue]
  'reorder-pinned': [newOrder: string[]]
  unpin: [issueId: string]
  'toggle-pinned-sort': []
}>()

const isInProgressCollapsed = useProjectStorage('inProgressCollapsed', true)
const isPinnedCollapsed = useProjectStorage('pinnedCollapsed', false)
const isReadyCollapsed = useProjectStorage('readyCollapsed', true)
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold">Issue Lists</h2>
        <p class="text-sm text-muted-foreground">
          Browse the status-driven lists that previously lived in the sidebar.
        </p>
      </div>

      <section v-if="inProgressIssues.length > 0" class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          class="flex w-full items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="isInProgressCollapsed = !isInProgressCollapsed"
        >
          <svg
            class="h-3 w-3 transition-transform"
            :class="{ '-rotate-90': isInProgressCollapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span class="uppercase tracking-wide">In Progress</span>
          <span class="ml-auto text-[10px]">({{ inProgressIssues.length }})</span>
        </button>
        <div v-show="!isInProgressCollapsed" class="mt-3">
          <QuickList :issues="inProgressIssues" @select="emit('select', $event)" />
        </div>
      </section>

      <section v-if="pinnedIssues.length > 0" class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            class="flex items-center gap-2 text-left transition-colors hover:text-foreground"
            @click="isPinnedCollapsed = !isPinnedCollapsed"
          >
            <svg
              class="h-3 w-3 transition-transform"
              :class="{ '-rotate-90': isPinnedCollapsed }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span class="uppercase tracking-wide">Pinned</span>
          </button>
          <span class="ml-auto text-[10px]">({{ pinnedIssues.length }})</span>
          <button
            v-if="!isPinnedCollapsed"
            class="rounded p-0.5 transition-colors hover:text-foreground"
            @click.stop="emit('toggle-pinned-sort')"
          >
            <svg v-if="pinnedSortMode === 'added'" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 4v6l-2 4h10l-2-4V4" /><line x1="12" y1="16" x2="12" y2="21" /><line x1="8" y1="4" x2="16" y2="4" />
            </svg>
            <svg v-else-if="pinnedSortMode === 'updated'" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <svg v-else class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" />
              <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
              <circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
        <div v-show="!isPinnedCollapsed" class="mt-3">
          <PinnedList
            :issues="pinnedIssues"
            :drag-enabled="pinnedSortMode === 'manual'"
            @select="emit('select', $event)"
            @reorder="emit('reorder-pinned', $event)"
            @unpin="emit('unpin', $event)"
          />
        </div>
      </section>

      <section class="rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          class="flex w-full items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          @click="isReadyCollapsed = !isReadyCollapsed"
        >
          <svg
            class="h-3 w-3 transition-transform"
            :class="{ '-rotate-90': isReadyCollapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span class="uppercase tracking-wide">Ready to Work</span>
          <span class="ml-auto text-[10px]">({{ readyIssues.length }})</span>
        </button>
        <div v-show="!isReadyCollapsed" class="mt-3">
          <QuickList :issues="readyIssues" @select="emit('select', $event)" />
        </div>
      </section>
    </div>
  </div>
</template>
