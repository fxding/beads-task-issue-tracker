<script setup lang="ts">
import { FolderKanban, Globe } from 'lucide-vue-next'

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
    class="relative flex items-center justify-center border-b bg-background py-3 pl-20 pr-4 app-drag-region"
    data-tauri-drag-region
    @mousedown="handleMouseDown"
  >
    <!-- Centered title with icon - pointer-events-none to allow drag through -->
    <div v-if="!editContext" class="flex items-center gap-3 pointer-events-none">
      <div class="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
        <FolderKanban class="size-5 text-muted-foreground" />
      </div>
      <h1 class="flex items-center gap-2 text-lg font-semibold leading-tight text-foreground">
        {{ displayTitle }}
        <Globe
          v-if="isExposed"
          class="size-4 text-muted-foreground"
        />
      </h1>
    </div>

    <!-- Edit context (centered, replaces title) - pointer-events-none to allow drag through -->
    <div v-else class="flex items-center gap-3 pointer-events-none">
      <span class="text-sm font-medium uppercase">
        <span class="text-foreground">{{ editContext }}</span>
        <span v-if="editId" class="ml-1 text-muted-foreground">{{ editId }}</span>
      </span>
    </div>

  </header>
</template>
