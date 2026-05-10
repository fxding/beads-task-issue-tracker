<script setup lang="ts">
const props = defineProps<{
  title: string
  value: number
  color?: string
  active?: boolean
}>()

defineEmits<{
  click: []
}>()

</script>

<template>
  <button
    class="w-full rounded-md border border-border/60 bg-card p-1.5 text-left transition-colors hover:bg-accent/40"
    :class="[
      active ? 'ring-2 ring-primary' : ''
    ]"
    @click="$emit('click')"
  >
    <div
      class="mb-0.5 truncate text-[9px] uppercase tracking-wide text-muted-foreground"
    >
      {{ title }}
    </div>
    <div class="text-lg font-bold" :style="color ? { color } : {}">
      {{ value }}
    </div>
  </button>
</template>
