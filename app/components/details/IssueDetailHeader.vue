<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Issue, UpdateIssuePayload } from '~/types/issue'
import { Input } from '~/components/ui/input'

const props = defineProps<{
  selectedIssue: Issue
  readonly?: boolean
}>()

const emit = defineEmits<{
  'save-inline': [payload: UpdateIssuePayload]
}>()

const title = ref('')

watch(
  () => props.selectedIssue.title,
  (nextTitle) => {
    title.value = nextTitle
  },
  { immediate: true },
)

const hasTitleChanges = computed(() => title.value !== props.selectedIssue.title)

const saveTitle = () => {
  if (!hasTitleChanges.value) return
  emit('save-inline', { title: title.value })
}

const resetTitle = () => {
  title.value = props.selectedIssue.title
}

const handleTitleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveTitle()
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    resetTitle()
  }
}
</script>

<template>
  <!-- Title -->
  <div>
    <Input
      v-model="title"
      :readonly="readonly"
      class="border-0 bg-transparent! px-0 font-semibold shadow-none focus-visible:ring-0"
      aria-label="Issue title"
      @keydown="handleTitleKeydown"
    />
  </div>
</template>
