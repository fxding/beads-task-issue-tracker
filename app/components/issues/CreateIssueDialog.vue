<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Check, ChevronRight, X } from 'lucide-vue-next'
import type { CreateIssuePayload, IssuePriority, IssueType } from '~/types/issue'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { MarkdownEditor } from '~/components/ui/markdown-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface EpicOption {
  id: string
  title: string
}

const props = defineProps<{
  open: boolean
  isSaving?: boolean
  availableEpics?: EpicOption[]
  availableLabels?: string[]
  defaultParent?: string
  dotNotationParent?: boolean
  currentProjectName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [payload: CreateIssuePayload]
}>()

const form = reactive({
  title: '',
  description: '',
  type: 'task' as IssueType,
  priority: 'p3' as IssuePriority,
  parent: props.defaultParent || '',
})

const typeOptions: { value: IssueType; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'task', label: 'Task' },
  { value: 'feature', label: 'Feature' },
  { value: 'epic', label: 'Epic' },
  { value: 'chore', label: 'Chore' },
]

const priorityOptions: { value: IssuePriority; label: string }[] = [
  { value: 'p0', label: 'P0' },
  { value: 'p1', label: 'P1' },
  { value: 'p2', label: 'P2' },
  { value: 'p3', label: 'P3' },
  { value: 'p4', label: 'P4' },
]

const NO_PARENT_VALUE = '__none__'

const availableParentEpics = computed(() => props.availableEpics ?? [])

const showParentPicker = computed(() =>
  availableParentEpics.value.length > 0
  && form.type !== 'epic'
  && !props.dotNotationParent,
)

const parentSelectValue = computed({
  get: () => form.parent || NO_PARENT_VALUE,
  set: (value: string) => {
    form.parent = value === NO_PARENT_VALUE ? '' : value
  },
})

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.type = 'task'
  form.priority = 'p3'
  form.parent = props.defaultParent || ''
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  },
)

watch(
  () => props.defaultParent,
  (defaultParent) => {
    if (props.open) form.parent = defaultParent || ''
  },
)

const submit = () => {
  const title = form.title.trim()
  if (!title || props.isSaving) return

  const payload: CreateIssuePayload = {
    title,
    description: form.description.trim() || undefined,
    type: form.type,
    priority: form.priority,
    parent: form.parent.trim() || undefined,
  }

  emit('create', payload)
}

const updateOpen = (value: boolean) => {
  emit('update:open', value)
}
</script>

<template>
  <Dialog :open="open" @update:open="updateOpen">
    <DialogContent
      class="!top-1/2 !left-1/2 !max-w-2xl !w-[calc(100vw-2rem)] !-translate-x-1/2 !-translate-y-1/2 p-0 gap-0 overflow-hidden"
      :show-close-button="false"
    >
      <form class="flex max-h-[80vh] min-h-96 flex-col" @submit.prevent="submit">
        <DialogHeader class="flex-row items-center justify-between space-y-0 border-b px-5 py-3">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 text-xs">
              <span class="truncate text-muted-foreground">
                {{ currentProjectName || 'Beads Task-Issue Tracker' }}
              </span>
              <ChevronRight class="size-3 text-muted-foreground/50" />
              <span class="font-medium">New issue</span>
            </div>
            <DialogTitle class="sr-only">Create issue</DialogTitle>
          </div>
          <button
            type="button"
            class="rounded-sm p-1.5 opacity-70 transition hover:bg-accent/60 hover:opacity-100"
            aria-label="Close"
            @click="updateOpen(false)"
          >
            <X class="size-4" />
          </button>
        </DialogHeader>

        <div class="shrink-0 px-5 py-3">
          <Input
            v-model="form.title"
            autofocus
            placeholder="Issue title"
            aria-label="Issue title"
            class="h-10 border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          <MarkdownEditor
            v-model="form.description"
            placeholder="Describe the issue..."
            min-height-class="min-h-40"
            :show-static-toolbar="false"
            :show-bubble-toolbar="true"
            class="text-sm"
          />
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
          <Select v-model="form.type">
            <SelectTrigger class="h-8 w-28 rounded-full text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
                class="text-xs"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="form.priority">
            <SelectTrigger class="h-8 w-24 rounded-full text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in priorityOptions"
                :key="option.value"
                :value="option.value"
                class="text-xs"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-if="showParentPicker" v-model="parentSelectValue">
            <SelectTrigger class="h-8 max-w-52 rounded-full text-xs">
              <SelectValue placeholder="No parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="NO_PARENT_VALUE" class="text-xs text-muted-foreground">
                No parent
              </SelectItem>
              <SelectItem
                v-for="epic in availableParentEpics"
                :key="epic.id"
                :value="epic.id"
                class="text-xs"
              >
                {{ epic.id }} · {{ epic.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter class="flex-row items-center justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="ghost" size="sm" :disabled="isSaving" @click="updateOpen(false)">
            Cancel
          </Button>
          <Button type="submit" size="sm" :disabled="!form.title.trim() || isSaving">
            <Check v-if="!isSaving" class="mr-1.5 size-3.5" />
            {{ isSaving ? 'Creating...' : 'Create' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
