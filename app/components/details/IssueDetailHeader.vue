<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Issue, UpdateIssuePayload } from '~/types/issue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

const props = defineProps<{
  selectedIssue: Issue
  readonly?: boolean
}>()

const emit = defineEmits<{
  'save-inline': [payload: UpdateIssuePayload]
  reopen: []
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
  <div class="bg-card/90 p-4 space-y-3">
    <!-- Title -->
    <div class="space-y-2">
      <Input
        v-model="title"
        :readonly="readonly"
        class="h-auto border-0 bg-transparent px-0 py-0 text-sm font-semibold shadow-none focus-visible:ring-0"
        aria-label="Issue title"
        @keydown="handleTitleKeydown"
      />
      <div v-if="!readonly && hasTitleChanges" class="flex items-center gap-2">
        <Button type="button" size="sm" @click="saveTitle">
          Save title
        </Button>
        <Button type="button" size="sm" variant="ghost" @click="resetTitle">
          Reset
        </Button>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-2 pb-1">
      <div class="flex items-center gap-1 flex-wrap">
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
