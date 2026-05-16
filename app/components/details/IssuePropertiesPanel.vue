<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, ChevronDown, Link2, LoaderCircle, Plus } from 'lucide-vue-next'
import type { Issue, IssuePriority, IssueStatus, UpdateIssuePayload } from '~/types/issue'
import LabelBadge from '~/components/issues/LabelBadge.vue'
import StatusBadge from '~/components/issues/StatusBadge.vue'
import PriorityBadge from '~/components/issues/PriorityBadge.vue'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { ScrollArea } from '~/components/ui/scroll-area'

const props = defineProps<{
  issue: Issue
  readonly?: boolean
  availableLabels?: string[]
  availableAssignees?: string[]
  availableParents?: Array<{ id: string; title: string }>
}>()

const emit = defineEmits<{
  'navigate-to-issue': [id: string]
  'save-inline': [payload: UpdateIssuePayload]
}>()

type EditablePropertyKey = 'status' | 'priority' | 'assignee' | 'labels' | 'parent'
type PropertyItem = {
  key: EditablePropertyKey
  label: string
  value?: string
  empty: boolean
  editable?: boolean
}

const statusOptions: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'closed', label: 'Closed' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'hooked', label: 'Hooked' },
]

const priorityOptions: { value: IssuePriority; label: string }[] = [
  { value: 'p0', label: 'P0 - Critical' },
  { value: 'p1', label: 'P1 - High' },
  { value: 'p2', label: 'P2 - Medium' },
  { value: 'p3', label: 'P3 - Low' },
  { value: 'p4', label: 'P4 - Minimal' },
]

const savingProperty = ref<EditablePropertyKey | null>(null)
const labelsMenuOpen = ref(false)
const labelsDraft = ref<string[]>([])
const newLabelInput = ref('')
const statusReadonly = computed(() => props.readonly && props.issue.status !== 'closed')

const emitSave = (key: EditablePropertyKey, payload: UpdateIssuePayload) => {
  if ((props.readonly && key !== 'status') || savingProperty.value === key) return
  savingProperty.value = key
  emit('save-inline', payload)
}

watch(
  () => [
    props.issue.status,
    props.issue.priority,
    props.issue.assignee,
    JSON.stringify(props.issue.labels || []),
    props.issue.parent?.id || '',
  ],
  () => {
    savingProperty.value = null
  },
)

const getShortId = (id: string) => {
  const lastHyphen = id.lastIndexOf('-')
  if (lastHyphen > 0) {
    return id.slice(lastHyphen + 1) || id
  }
  return id
}

const relationTypeLabels: Record<string, string> = {
  'relates-to': 'Relates To',
  related: 'Related',
  'discovered-from': 'Discovered From',
  duplicates: 'Duplicates',
  supersedes: 'Supersedes',
  'caused-by': 'Caused By',
}

const getRelationLabel = (type: string): string => {
  return relationTypeLabels[type] || type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const naturalCompare = (a: string, b: string): number => {
  const aParts = a.split(/(\d+)/)
  const bParts = b.split(/(\d+)/)

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || ''
    const bPart = bParts[i] || ''

    const aNum = parseInt(aPart, 10)
    const bNum = parseInt(bPart, 10)

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum
    } else if (aPart !== bPart) {
      return aPart.localeCompare(bPart)
    }
  }

  return 0
}

const groupedRelations = computed(() => {
  if (!props.issue.relations?.length) return []

  const groups = new Map<string, typeof props.issue.relations>()
  for (const rel of props.issue.relations) {
    const existing = groups.get(rel.relationType) || []
    existing.push(rel)
    groups.set(rel.relationType, existing)
  }

  return Array.from(groups.entries()).map(([type, items]) => ({
    type,
    label: getRelationLabel(type),
    items: [...items].sort((a, b) => naturalCompare(a.id.toLowerCase(), b.id.toLowerCase())),
  }))
})

const hasEditableOptions = computed(() => ({
  assignee: Boolean(props.availableAssignees?.length || props.issue.assignee),
  labels: Boolean(props.availableLabels?.length || props.issue.labels?.length),
  parent: Boolean(props.availableParents?.length || props.issue.parent),
}))

const labelOptions = computed(() => {
  const labels = new Set<string>(props.availableLabels || [])
  for (const label of props.issue.labels || []) {
    labels.add(label)
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b))
})

const filteredLabelOptions = computed(() => {
  const query = newLabelInput.value.trim().toLowerCase()
  const labels = normalizeLabels([...labelOptions.value, ...labelsDraft.value])
  if (!query) return labels
  return labels.filter(label => label.toLowerCase().includes(query))
})

const propertyItems = computed<PropertyItem[]>(() => {
  const items: PropertyItem[] = [
    {
      key: 'status',
      label: 'Status',
      empty: false,
    },
    {
      key: 'priority',
      label: 'Priority',
      empty: false,
    },
    {
      key: 'assignee',
      label: 'Assignee',
      value: props.issue.assignee || 'Unassigned',
      empty: !props.issue.assignee,
      editable: hasEditableOptions.value.assignee,
    },
    {
      key: 'labels',
      label: 'Labels',
      empty: !props.issue.labels?.length,
      editable: hasEditableOptions.value.labels,
    },
  ]

  if (hasEditableOptions.value.parent) {
    items.push({
      key: 'parent',
      label: 'Parent',
      value: props.issue.parent?.title || 'No parent',
      empty: !props.issue.parent,
      editable: hasEditableOptions.value.parent,
    })
  }

  return items
})

const parentValue = computed(() => props.issue.parent?.id || '__none__')

const normalizeLabels = (labels: string[]) =>
  [...new Set(labels.map(label => label.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const updateLabels = (labels: string[]) => {
  const currentLabels = [...(props.issue.labels || [])].sort((a, b) => a.localeCompare(b))
  const nextLabels = normalizeLabels(labels)

  if (JSON.stringify(currentLabels) === JSON.stringify(nextLabels)) return
  emitSave('labels', { labels: nextLabels })
}

const syncLabelsDraft = () => {
  labelsDraft.value = [...(props.issue.labels || [])]
}

watch(
  () => props.issue.labels,
  () => {
    if (!labelsMenuOpen.value) {
      syncLabelsDraft()
    }
  },
  { immediate: true, deep: true },
)

const setLabelsMenuOpen = (open: boolean) => {
  if (open) {
    syncLabelsDraft()
    newLabelInput.value = ''
    labelsMenuOpen.value = true
    return
  }

  labelsMenuOpen.value = false
  const nextLabels = normalizeLabels(labelsDraft.value)
  newLabelInput.value = ''
  updateLabels(nextLabels)
}

const toggleDraftLabel = (label: string) => {
  if (labelsDraft.value.includes(label)) {
    labelsDraft.value = labelsDraft.value.filter(existing => existing !== label)
    return
  }
  labelsDraft.value = [...labelsDraft.value, label]
}

const addNewDraftLabel = () => {
  const newLabel = newLabelInput.value.trim()
  if (!newLabel) return
  if (!labelsDraft.value.some(label => label.toLowerCase() === newLabel.toLowerCase())) {
    labelsDraft.value = [...labelsDraft.value, newLabel]
  }
  newLabelInput.value = ''
}

const handleNewLabelKeydown = (event: KeyboardEvent) => {
  event.stopPropagation()
  if (event.key === 'Enter') {
    event.preventDefault()
    addNewDraftLabel()
  }
}

const updateAssignee = (assignee?: string) => {
  if ((props.issue.assignee || '') === (assignee || '')) return
  emitSave('assignee', { assignee: assignee || '' })
}

const updateStatus = (status: string) => {
  if (props.issue.status === status) return
  emitSave('status', { status: status as IssueStatus })
}

const updatePriority = (priority: string) => {
  if (props.issue.priority === priority) return
  emitSave('priority', { priority: priority as IssuePriority })
}

const updateParent = (parent: string) => {
  const nextParent = parent === '__none__' ? '' : parent
  if ((props.issue.parent?.id || '') === nextParent) return
  emitSave('parent', { parent: nextParent })
}
</script>

<template>
  <aside class="space-y-3">
    <div class="rounded-2xl border border-border/70 bg-card/90 p-4">
      <div class="space-y-2">
        <div
          v-for="item in propertyItems"
          :key="item.key"
          class="rounded-xl py-2 text-left"
        >
          <div class="min-w-0">
            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</p>
            <div class="mt-1 min-h-5">
              <DropdownMenu v-if="item.key === 'status'">
                <DropdownMenuTrigger as-child :disabled="statusReadonly">
                  <Button variant="ghost" size="sm" class="h-auto min-h-6 justify-start !px-0 text-left hover:bg-transparent disabled:opacity-100">
                    <StatusBadge :status="issue.status" size="sm" />
                    <LoaderCircle v-if="savingProperty === 'status'" class="ml-2 size-3 animate-spin text-muted-foreground" />
                    <ChevronDown v-else-if="!statusReadonly" class="ml-2 size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuRadioGroup :model-value="issue.status" @update:model-value="updateStatus">
                    <DropdownMenuRadioItem
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="text-xs"
                    >
                      {{ opt.label }}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu v-else-if="item.key === 'priority'">
                <DropdownMenuTrigger as-child :disabled="readonly">
                  <Button variant="ghost" size="sm" class="h-auto min-h-6 justify-start !px-0 text-left hover:bg-transparent disabled:opacity-100">
                    <PriorityBadge :priority="issue.priority" size="sm" />
                    <LoaderCircle v-if="savingProperty === 'priority'" class="ml-2 size-3 animate-spin text-muted-foreground" />
                    <ChevronDown v-else-if="!readonly" class="ml-2 size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuRadioGroup :model-value="issue.priority" @update:model-value="updatePriority">
                    <DropdownMenuRadioItem
                      v-for="opt in priorityOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="text-xs"
                    >
                      {{ opt.label }}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu v-else-if="item.key === 'assignee' && item.editable">
                <DropdownMenuTrigger as-child :disabled="readonly">
                  <Button variant="ghost" size="sm" class="h-auto min-h-6 justify-start !px-0 text-left hover:bg-transparent disabled:opacity-100">
                    <p class="truncate text-xs" :class="item.empty ? 'text-muted-foreground' : 'text-foreground'">{{ item.value }}</p>
                    <LoaderCircle v-if="savingProperty === 'assignee'" class="ml-2 size-3 animate-spin text-muted-foreground" />
                    <ChevronDown v-else-if="!readonly" class="ml-2 size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem class="text-xs" @select="updateAssignee()">
                    Unassigned
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ScrollArea v-if="availableAssignees?.length" class="max-h-64">
                    <DropdownMenuItem
                      v-for="assignee in availableAssignees"
                      :key="assignee"
                      class="text-xs"
                      @select="updateAssignee(assignee)"
                    >
                      <Check
                        class="size-3.5"
                        :class="issue.assignee === assignee ? 'opacity-100' : 'opacity-0'"
                      />
                      <span>{{ assignee }}</span>
                    </DropdownMenuItem>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu
                v-else-if="item.key === 'labels' && item.editable"
                :open="labelsMenuOpen"
                :modal="false"
                @update:open="setLabelsMenuOpen"
              >
                <DropdownMenuTrigger as-child :disabled="readonly">
                  <Button variant="ghost" size="sm" class="h-auto min-h-6 max-w-full justify-start !px-0 text-left hover:bg-transparent disabled:opacity-100">
                    <div v-if="issue.labels?.length" class="flex flex-wrap gap-1">
                      <LabelBadge v-for="label in issue.labels" :key="label" :label="label" size="sm" />
                    </div>
                    <p v-else class="truncate text-xs text-muted-foreground">No labels</p>
                    <LoaderCircle v-if="savingProperty === 'labels'" class="ml-2 size-3 animate-spin text-muted-foreground" />
                    <ChevronDown v-else-if="!readonly" class="ml-2 size-3 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-72 overflow-visible p-0">
                  <div class="rounded-md bg-popover">
                    <div class="sticky top-0 z-10 border-b border-border bg-popover/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-popover/85">
                      <div class="flex items-stretch gap-2">
                        <input
                          v-model="newLabelInput"
                          type="text"
                          placeholder="Add new label..."
                          class="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          @keydown="handleNewLabelKeydown"
                          @keyup.stop
                          @keypress.stop
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          class="h-9 shrink-0 gap-1.5 px-3 text-xs"
                          :disabled="!newLabelInput.trim()"
                          @click="addNewDraftLabel"
                        >
                          <Plus class="size-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>

                    <div v-if="!filteredLabelOptions.length && !newLabelInput.trim()" class="px-4 py-3 text-xs text-muted-foreground">
                      No labels available
                    </div>

                    <div v-else-if="!filteredLabelOptions.length" class="px-4 py-3 text-xs text-muted-foreground">
                      No matching labels
                    </div>

                    <ScrollArea v-else class="h-64 p-2">
                      <div class="space-y-1">
                        <DropdownMenuCheckboxItem
                          v-for="label in filteredLabelOptions"
                          :key="label"
                          :checked="labelsDraft.includes(label)"
                          class="pl-2 text-xs"
                          @select.prevent="toggleDraftLabel(label)"
                        >
                          <Check
                            class="size-3.5 text-foreground"
                            :class="labelsDraft.includes(label) ? 'opacity-100' : 'opacity-0'"
                          />
                          <span class="truncate">{{ label }}</span>
                        </DropdownMenuCheckboxItem>
                      </div>
                    </ScrollArea>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu v-else-if="item.key === 'parent' && item.editable">
                <DropdownMenuTrigger as-child :disabled="readonly">
                  <Button variant="ghost" size="sm" class="h-auto min-h-6 max-w-full justify-start !px-0 text-left hover:bg-transparent disabled:opacity-100">
                    <p v-if="issue.parent" class="truncate text-xs text-foreground">{{ getShortId(issue.parent.id) }} · {{ issue.parent.title }}</p>
                    <p v-else class="truncate text-xs text-muted-foreground">No parent</p>
                    <LoaderCircle v-if="savingProperty === 'parent'" class="ml-2 size-3 animate-spin text-muted-foreground" />
                    <ChevronDown v-else-if="!readonly" class="ml-2 size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-64">
                  <DropdownMenuRadioGroup :model-value="parentValue" @update:model-value="updateParent">
                    <DropdownMenuRadioItem value="__none__" class="text-xs">
                      No parent
                    </DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <ScrollArea v-if="availableParents?.length" class="max-h-64">
                      <DropdownMenuRadioItem
                        v-for="parent in availableParents"
                        :key="parent.id"
                        :value="parent.id"
                        class="text-xs"
                      >
                        <span class="truncate">{{ getShortId(parent.id) }} · {{ parent.title }}</span>
                      </DropdownMenuRadioItem>
                    </ScrollArea>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <p v-else class="truncate text-xs" :class="item.empty ? 'text-muted-foreground' : 'text-foreground'">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="groupedRelations.length"
        class="mt-4 border-t border-border/60 pt-4"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h4 class="text-sm font-medium text-foreground">Related</h4>
          <span class="text-xs text-muted-foreground">{{ issue.relations?.length || 0 }}</span>
        </div>

        <div class="space-y-3">
          <div v-for="group in groupedRelations" :key="group.type" class="space-y-1.5">
            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{{ group.label }}</p>
            <button
              v-for="rel in group.items"
              :key="rel.id"
              type="button"
              class="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-2.5 py-2 text-left hover:bg-muted/60"
              @click="emit('navigate-to-issue', rel.id)"
            >
              <Link2 class="size-3.5 shrink-0 text-muted-foreground" />
              <div class="min-w-0 flex-1">
                <p class="font-mono text-xs text-foreground">{{ getShortId(rel.id) }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ rel.title || rel.id }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
