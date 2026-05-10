<script setup lang="ts">
import type { IssuePriority } from '~/types/issue'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  priority: IssuePriority
  size?: 'default' | 'sm'
}>()

const priorityConfig: Record<IssuePriority, { label: string; class: string }> = {
  p0: { label: 'P0', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  p1: { label: 'P1', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  p2: { label: 'P2', class: 'border-transparent bg-secondary text-secondary-foreground' },
  p3: { label: 'P3', class: 'border-transparent bg-muted text-muted-foreground' },
  p4: { label: 'P4', class: 'border-transparent bg-muted text-muted-foreground' },
}

const config = computed(() => priorityConfig[props.priority] || priorityConfig.p3)
</script>

<template>
  <Badge :class="[config.class, size === 'sm' ? 'px-1.5 py-0 text-[10px]' : '']" variant="outline">
    {{ config.label }}
  </Badge>
</template>
