<script setup lang="ts">
import type { IssueStatus } from '~/types/issue'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  status: IssueStatus
  size?: 'default' | 'sm'
}>()

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

const config = computed(() => statusConfig[props.status] || statusConfig.open)
</script>

<template>
  <Badge :class="[config.class, size === 'sm' ? 'px-1.5 py-0 text-[10px]' : '']" variant="outline">
    {{ config.label }}
  </Badge>
</template>
