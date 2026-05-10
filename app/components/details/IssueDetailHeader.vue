<script setup lang="ts">
import { Ellipsis, Link2, Paperclip, ShieldAlert } from 'lucide-vue-next'
import type { Issue } from '~/types/issue'
import TypeBadge from '~/components/issues/TypeBadge.vue'
import StatusBadge from '~/components/issues/StatusBadge.vue'
import PriorityBadge from '~/components/issues/PriorityBadge.vue'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

defineProps<{
  selectedIssue: Issue
  isPinned?: boolean
}>()

defineEmits<{
  edit: []
  reopen: []
  close: []
  delete: []
  'toggle-pin': []
  'add-attachment': []
  'add-blocker': []
  'add-relation': []
}>()
</script>

<template>
  <div class="p-4 pb-0 space-y-3 border-b border-border">
    <!-- Badges row -->
    <div class="flex items-center gap-1.5 flex-wrap">
      <CopyableId :value="selectedIssue.id" :display-value="selectedIssue.id.includes('-') ? selectedIssue.id.slice(selectedIssue.id.lastIndexOf('-') + 1) : selectedIssue.id" />
      <TypeBadge :type="selectedIssue.type" size="sm" />
      <StatusBadge :status="selectedIssue.status" size="sm" />
      <PriorityBadge :priority="selectedIssue.priority" size="sm" />
    </div>

    <!-- Title -->
    <div class="flex items-start gap-2">
      <h3 class="min-w-0 flex-1 text-sm font-semibold line-clamp-2">{{ selectedIssue.title }}</h3>
      <Button
        :variant="isPinned ? 'secondary' : 'ghost'"
        size="icon-sm"
        class="h-7 w-7 shrink-0"
        :aria-label="isPinned ? 'Unpin issue' : 'Pin issue'"
        @click="$emit('toggle-pin')"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" :fill="isPinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 4v6l-2 4h10l-2-4V4" /><line x1="12" y1="16" x2="12" y2="21" /><line x1="8" y1="4" x2="16" y2="4" />
        </svg>
      </Button>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center justify-between gap-2 pb-3">
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
        <!-- Close button: only when not closed -->
        <Button
          v-if="selectedIssue.status !== 'closed'"
          variant="outline"
          size="sm"
          @click="$emit('close')"
        >
          <svg class="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Close
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm" class="h-8 w-8 shrink-0" aria-label="More actions">
            <Ellipsis class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem v-if="selectedIssue.status !== 'closed'" @select="$emit('add-attachment')">
            <Paperclip class="mr-2 h-3.5 w-3.5" />
            Attach file
          </DropdownMenuItem>
          <DropdownMenuItem v-if="selectedIssue.status !== 'closed'" @select="$emit('add-blocker')">
            <ShieldAlert class="mr-2 h-3.5 w-3.5" />
            Add blocker
          </DropdownMenuItem>
          <DropdownMenuItem v-if="selectedIssue.status !== 'closed'" @select="$emit('add-relation')">
            <Link2 class="mr-2 h-3.5 w-3.5" />
            Create related
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @select="$emit('delete')">
            <svg class="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
