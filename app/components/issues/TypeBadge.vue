<script setup lang="ts">
import type { IssueType } from '~/types/issue'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  type: IssueType
  size?: 'default' | 'sm'
}>()

const typeConfig: Record<IssueType, { label: string; class: string }> = {
  bug: { label: 'BUG', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  task: { label: 'TASK', class: 'border-transparent bg-secondary text-secondary-foreground' },
  feature: { label: 'FEATURE', class: 'border-transparent bg-secondary text-secondary-foreground' },
  epic: { label: 'EPIC', class: 'border-transparent bg-secondary text-secondary-foreground' },
  chore: { label: 'CHORE', class: 'border-transparent bg-muted text-muted-foreground' },
}

const config = computed(() => typeConfig[props.type] || typeConfig.task)
</script>

<template>
  <Badge :class="[config.class, size === 'sm' ? 'px-1.5 py-0 text-[10px]' : '']" variant="outline">
    {{ config.label }}
  </Badge>
</template>
