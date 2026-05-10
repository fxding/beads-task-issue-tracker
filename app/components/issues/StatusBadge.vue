<script setup lang="ts">
import type { IssueStatus } from '~/types/issue'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  status: IssueStatus
  size?: 'default' | 'sm'
}>()

const { showBadgeIcons } = useTheme()

const statusConfig: Record<IssueStatus, { label: string; class: string }> = {
  open: { label: 'OPEN', class: 'border-transparent bg-secondary text-secondary-foreground' },
  in_progress: { label: 'IN PROGRESS', class: 'border-transparent bg-secondary text-secondary-foreground' },
  blocked: { label: 'BLOCKED', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  closed: { label: 'CLOSED', class: 'border-transparent bg-muted text-muted-foreground' },
  deferred: { label: 'DEFERRED', class: 'border-transparent bg-muted text-muted-foreground' },
  tombstone: { label: 'DELETED', class: 'border-transparent bg-muted text-muted-foreground' },
  pinned: { label: 'PINNED', class: 'border-transparent bg-secondary text-secondary-foreground' },
  hooked: { label: 'HOOKED', class: 'border-transparent bg-secondary text-secondary-foreground' },
}

// SVG icon paths for each status (12x12 viewBox)
const statusIcons: Partial<Record<IssueStatus, string>> = {
  open: 'M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM2 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0z',
  in_progress: 'M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM2 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0zM5 4v3l2.5 1.5',
  blocked: 'M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM2 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0zM4 4l4 4M8 4l-4 4',
  closed: 'M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zM2 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0zM4 6l1.5 1.5L8 4.5',
}

const config = computed(() => statusConfig[props.status] || statusConfig.open)
</script>

<template>
  <Badge :class="[config.class, size === 'sm' ? 'px-1.5 py-0 text-[10px]' : '']" variant="outline">
    <span v-if="showBadgeIcons && statusIcons[status]" class="inline-flex items-center mr-1">
      <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <path :d="statusIcons[status]" />
      </svg>
    </span>
    {{ config.label }}
  </Badge>
</template>
