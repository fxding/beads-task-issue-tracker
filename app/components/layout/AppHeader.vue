<script setup lang="ts">
const props = defineProps<{
  projectName?: string
  editContext?: string
  editId?: string
  isExposed?: boolean
}>()

// Title: show project name if selected, otherwise default app title
const displayTitle = computed(() => props.projectName || 'Beads Task-Issue Tracker')

const { startDragging } = useTauriWindow()

// Handle window dragging via Tauri API
const handleMouseDown = (event: MouseEvent) => {
  // Only handle left click
  if (event.button !== 0) return

  // Don't start dragging if click is inside a no-drag zone (buttons, inputs, etc.)
  const target = event.target as HTMLElement
  if (target.closest('.app-no-drag')) return

  startDragging()
}
</script>

<template>
  <!-- macOS: pl-20 leaves space for traffic lights, mousedown triggers Tauri window dragging -->
  <header
    class="flex items-center justify-center pl-20 pr-4 py-3 border-b border-border bg-card relative app-drag-region"
    data-tauri-drag-region
    @mousedown="handleMouseDown"
  >
    <!-- Centered title with icon - pointer-events-none to allow drag through -->
    <div v-if="!editContext" class="flex items-center gap-3 pointer-events-none">
      <svg
        class="w-8 h-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke-width="2"
      >
        <!-- Curved lines from center to center (circles drawn on top will hide the ends) -->
        <path d="M 4 5 Q 3 12 12 18" stroke="currentColor" class="text-muted-foreground" />
        <path d="M 12 18 Q 21 12 20 5" stroke="currentColor" class="text-muted-foreground" />
        <path d="M 20 5 Q 12 1 4 5" stroke="currentColor" class="text-muted-foreground" />
        <circle cx="4" cy="5" r="3" fill="#22c55e" />
        <circle cx="20" cy="5" r="3" fill="#eab308" />
        <circle cx="12" cy="18" r="3" fill="#ef4444" />
      </svg>
      <h1 class="text-lg font-semibold text-foreground leading-tight flex items-center gap-2">
        {{ displayTitle }}
        <svg
          v-if="isExposed"
          class="w-4 h-4 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </h1>
    </div>

    <!-- Edit context (centered, replaces title) - pointer-events-none to allow drag through -->
    <div v-else class="flex items-center gap-3 pointer-events-none">
      <span class="text-sm font-medium uppercase">
        <span class="text-foreground">{{ editContext }}</span>
        <span v-if="editId" class="text-sky-400 ml-1">{{ editId }}</span>
      </span>
    </div>

  </header>
</template>
