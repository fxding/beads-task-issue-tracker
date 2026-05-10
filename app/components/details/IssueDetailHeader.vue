<script setup lang="ts">
import type { Issue } from '~/types/issue'
import { Button } from '~/components/ui/button'

defineProps<{
  selectedIssue: Issue
}>()

defineEmits<{
  edit: []
  reopen: []
}>()
</script>

<template>
  <div class="bg-card/90 p-4 space-y-3">
    <!-- Title -->
    <h3 class="text-sm font-semibold line-clamp-2">{{ selectedIssue.title }}</h3>

    <!-- Action buttons -->
    <div class="flex items-center gap-2 pb-1">
      <div class="flex items-center gap-1 flex-wrap">
        <!-- Edit button: only when not closed -->
        <Button v-if="selectedIssue.status !== 'closed'" size="sm" @click="$emit('edit')">
          <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </Button>
        <!-- Reopen button: only when closed -->
        <Button
          v-if="selectedIssue.status === 'closed'"
          size="sm"
          @click="$emit('reopen')"
        >
          <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reopen
        </Button>
      </div>
    </div>
  </div>
</template>
