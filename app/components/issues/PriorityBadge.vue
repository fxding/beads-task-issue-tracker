<script setup lang="ts">
import type { IssuePriority } from '~/types/issue'
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  priority: IssuePriority
  size?: 'default' | 'sm'
}>()

const { showBadgeIcons } = useTheme()

const priorityConfig: Record<IssuePriority, { label: string; class: string }> = {
  p0: { label: 'P0', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  p1: { label: 'P1', class: 'border-destructive/30 bg-destructive/10 text-destructive' },
  p2: { label: 'P2', class: 'border-transparent bg-secondary text-secondary-foreground' },
  p3: { label: 'P3', class: 'border-transparent bg-muted text-muted-foreground' },
  p4: { label: 'P4', class: 'border-transparent bg-muted text-muted-foreground' },
}

// SVG icon paths for each priority (12x12 viewBox)
const priorityIcons: Record<IssuePriority, string> = {
  p0: 'M6 9V3M3.5 5L6 2.5 8.5 5M3.5 7L6 4.5 8.5 7',
  p1: 'M6 9V3M3.5 5.5L6 3 8.5 5.5',
  p2: 'M3 6h6',
  p3: 'M6 3v6M3.5 6.5L6 9 8.5 6.5',
  p4: 'M6 3v6M3.5 5L6 7.5 8.5 5M3.5 7L6 9.5 8.5 7',
}

const config = computed(() => priorityConfig[props.priority] || priorityConfig.p3)
</script>

<template>
  <Badge :class="[config.class, size === 'sm' ? 'px-1.5 py-0 text-[10px]' : '']" variant="outline">
    <span v-if="showBadgeIcons" class="inline-flex items-center mr-1">
      <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path :d="priorityIcons[priority] || priorityIcons.p3" />
      </svg>
    </span>
    {{ config.label }}
  </Badge>
</template>
