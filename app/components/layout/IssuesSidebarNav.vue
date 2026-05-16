<script setup lang="ts">
type IssuesView = 'table' | 'list' | 'board' | 'stats'

defineProps<{
  activeView: IssuesView
}>()

const emit = defineEmits<{
  select: [view: IssuesView]
}>()

const items: Array<{ id: IssuesView, label: string, description: string }> = [
  { id: 'table', label: 'Table', description: 'Current issue table and filters' },
  { id: 'list', label: 'List', description: 'Status-based browsing and pinned work' },
  { id: 'board', label: 'Board', description: 'Move issues across kanban lanes' },
  { id: 'stats', label: 'Stats', description: 'Project stats and charts' },
]
</script>

<template>
  <div class="space-y-2">
    <div class="px-2">
      <p class="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Issues</p>
    </div>

    <nav class="space-y-1" aria-label="Issues views">
      <button
        v-for="item in items"
        :key="item.id"
        class="w-full rounded-lg border px-3 py-2 text-left transition-colors"
        :class="activeView === item.id
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground'"
        @click="emit('select', item.id)"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium">{{ item.label }}</span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ item.description }}
        </p>
      </button>
    </nav>
  </div>
</template>
