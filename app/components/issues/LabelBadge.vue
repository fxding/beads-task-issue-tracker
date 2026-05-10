<script setup lang="ts">
import { Badge } from '~/components/ui/badge'

const props = defineProps<{
  label: string
  size?: 'sm' | 'md'
}>()

// Generate a stable accent color per label.
const getColorFromLabel = (label: string) => {
  let hash = 5381
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) + hash) ^ label.charCodeAt(i)
  }

  const colors = [
    '#be185d',
    '#a21caf',
    '#7e22ce',
    '#6d28d9',
    '#4f46e5',
    '#0284c7',
    '#0d9488',
    '#c026d3',
    '#db2777',
    '#7c3aed',
    '#0891b2',
    '#9333ea',
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index] ?? '#7e22ce'
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const badgeStyle = computed(() => {
  const color = getColorFromLabel(props.label)
  return {
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.28),
    color,
  }
})

const sizeClasses = computed(() => {
  return props.size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'text-xs'
})
</script>

<template>
  <Badge
    variant="outline"
    class="inline-flex items-center whitespace-nowrap border font-medium"
    :class="sizeClasses"
    :style="badgeStyle"
  >
    {{ label }}
  </Badge>
</template>
