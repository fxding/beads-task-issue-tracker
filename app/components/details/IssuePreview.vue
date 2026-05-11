<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import type { Issue, UpdateIssuePayload } from '~/types/issue'
import { Button } from '~/components/ui/button'
import { LinkifiedText } from '~/components/ui/linkified-text'
import { MarkdownEditor } from '~/components/ui/markdown-editor'
import StatusBadge from '~/components/issues/StatusBadge.vue'
import PriorityBadge from '~/components/issues/PriorityBadge.vue'
import { extractNonImageRefs } from '~/utils/markdown'

const props = defineProps<{
  issue: Issue
  readonly?: boolean
  availableIssues?: Array<{ id: string; title: string; priority?: string; status?: string }>
}>()

const hasDependencies = computed(() => Boolean(props.issue.blockedBy?.length || props.issue.blocks?.length))

// Extract non-image external references (URLs, IDs) — only real refs now
const nonImageRefs = computed(() => extractNonImageRefs(props.issue.externalRef))

const emit = defineEmits<{
  'navigate-to-issue': [id: string]
  'attach-image': [paths: string[]]
  'detach-image': [path: string]
  'create-child': [parentId: string]
  'open-add-blocker': [issueId: string]
  'remove-dependency': [issueId: string, blockerId: string]
  'save-inline': [payload: UpdateIssuePayload]
}>()

type InlineField = 'description' | 'acceptanceCriteria' | null

const inlineForm = reactive({
  description: props.issue.description || '',
  acceptanceCriteria: props.issue.acceptanceCriteria || '',
})

const savingField = ref<InlineField>(null)

watch(
  () => props.issue,
  (issue) => {
    inlineForm.description = issue.description || ''
    inlineForm.acceptanceCriteria = issue.acceptanceCriteria || ''
  },
  { immediate: true }
)

const canInlineEdit = computed(() => !props.readonly)
const hasDescriptionChanges = computed(() => inlineForm.description !== (props.issue.description || ''))
const hasAcceptanceCriteriaChanges = computed(() => inlineForm.acceptanceCriteria !== (props.issue.acceptanceCriteria || ''))

const resetInlineField = (field: Exclude<InlineField, null>) => {
  inlineForm[field] = props.issue[field] || ''
}

const saveInlineField = (field: Exclude<InlineField, null>) => {
  const hasChanges = field === 'description'
    ? hasDescriptionChanges.value
    : hasAcceptanceCriteriaChanges.value

  if (!hasChanges) return

  savingField.value = field
  emit('save-inline', {
    [field]: inlineForm[field],
  })
}

watch(
  () => [props.issue.description, props.issue.acceptanceCriteria],
  () => {
    savingField.value = null
  },
)

// Natural sort comparison for IDs (handles multi-digit numbers correctly)
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
    } else {
      if (aPart !== bPart) return aPart.localeCompare(bPart)
    }
  }
  return 0
}

// Get short ID by removing the project prefix (e.g., "beads-demo-5tg.2" → "5tg.2")
const getShortId = (id: string) => {
  const lastHyphen = id.lastIndexOf('-')
  if (lastHyphen > 0) {
    return id.slice(lastHyphen + 1) || id
  }
  return id
}

// Sorted children using natural sort (1, 2, 3, ... 10 instead of 1, 10, 2, 3)
const sortedChildren = computed(() => {
  if (!props.issue.children?.length) return []
  return [...props.issue.children].sort((a, b) =>
    naturalCompare(a.id.toLowerCase(), b.id.toLowerCase())
  )
})

// Sorted dependencies using natural sort
const sortedBlockedBy = computed(() => {
  if (!props.issue.blockedBy?.length) return []
  return [...props.issue.blockedBy].sort((a, b) => naturalCompare(a.toLowerCase(), b.toLowerCase()))
})

const sortedBlocks = computed(() => {
  if (!props.issue.blocks?.length) return []
  return [...props.issue.blocks].sort((a, b) => naturalCompare(a.toLowerCase(), b.toLowerCase()))
})

// Lookup issue title from availableIssues
const getIssueTitle = (id: string) => {
  return props.availableIssues?.find(i => i.id === id)?.title
}

const depTextColor = (priority?: string) => {
  const colors: Record<string, string> = {
    p0: 'text-destructive',
    p1: 'text-destructive',
    p2: 'text-foreground',
    p3: 'text-muted-foreground',
    p4: 'text-muted-foreground',
  }
  return colors[priority || ''] || 'text-foreground'
}

const handleRemoveDependency = (id: string, section: 'blockedBy' | 'blocks') => {
  if (section === 'blockedBy') {
    // Current issue is blocked by `id` → remove dep(currentIssue, id)
    emit('remove-dependency', props.issue.id, id)
  } else {
    // Current issue blocks `id` → remove dep(id, currentIssue)
    emit('remove-dependency', id, props.issue.id)
  }
}

// Collapsible section states (persisted per project, all open by default)
interface PreviewCollapsedState {
  description: boolean
  parent: boolean
  children: boolean
  dependencies: boolean
  externalRef: boolean
  estimate: boolean
  designNotes: boolean
  acceptanceCriteria: boolean
  workingNotes: boolean
  metadata: boolean
  specId: boolean
}

const defaultCollapsedState: PreviewCollapsedState = {
  description: true,
  parent: true,
  children: true,
  dependencies: true,
  externalRef: true,
  estimate: true,
  designNotes: true,
  acceptanceCriteria: true,
  workingNotes: true,
  metadata: true,
  specId: true,
}

const previewSections = useProjectStorage<PreviewCollapsedState>('previewSections', defaultCollapsedState)

// Toggle functions for each section
const toggleSection = (section: keyof PreviewCollapsedState) => {
  const newValue = {
    ...previewSections.value,
    [section]: !previewSections.value[section],
  }
  previewSections.value = newValue
  // Explicitly save since watcher doesn't trigger reliably
  saveProjectValue('previewSections', newValue)
}

// Direct getters for template (no computed writable - better reactivity)
const isDescriptionOpen = computed(() => previewSections.value.description)
const isParentOpen = computed(() => previewSections.value.parent)
const isChildrenOpen = computed(() => previewSections.value.children)
const isDependenciesOpen = computed(() => previewSections.value.dependencies)
const isExternalRefOpen = computed(() => previewSections.value.externalRef)
const isEstimateOpen = computed(() => previewSections.value.estimate)
const isDesignNotesOpen = computed(() => previewSections.value.designNotes)
const isAcceptanceCriteriaOpen = computed(() => previewSections.value.acceptanceCriteria)
const isWorkingNotesOpen = computed(() => previewSections.value.workingNotes)
const isMetadataOpen = computed(() => previewSections.value.metadata)
const isSpecIdOpen = computed(() => previewSections.value.specId)

const formatMetadata = (raw: string): string => {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatEstimate = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
</script>

<template>
  <div class="space-y-3">
    <!-- Description Section -->
    <div>
      <div class="flex items-center justify-between gap-2">
        <button
          class="flex items-center gap-1.5 text-left group"
          @click="toggleSection('description')"
        >
          <svg
            class="w-3 h-3 text-muted-foreground transition-transform"
            :class="{ '-rotate-90': !isDescriptionOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Description</h4>
        </button>
        <div v-if="canInlineEdit && hasDescriptionChanges" class="flex items-center gap-2">
          <Button type="button" size="sm" aria-label="Save description" :disabled="savingField === 'description'" @click="saveInlineField('description')">
            Save description
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="resetInlineField('description')">
            Reset
          </Button>
        </div>
      </div>
      <div v-show="isDescriptionOpen" class="mt-1 pl-4.5">
        <MarkdownEditor
          v-if="canInlineEdit"
          v-model="inlineForm.description"
          placeholder="Describe the issue..."
          class="text-xs"
          min-height-class="min-h-28"
          :show-static-toolbar="false"
          :show-bubble-toolbar="true"
        />
        <div v-else class="text-xs"><LinkifiedText :text="issue.description" fallback="No description provided." /></div>
      </div>
    </div>

    <!-- Acceptance Criteria Section -->
    <div v-if="issue.acceptanceCriteria || canInlineEdit">
      <div class="flex items-center justify-between gap-2">
        <button
          class="flex items-center gap-1.5 text-left group"
          @click="toggleSection('acceptanceCriteria')"
        >
          <svg
            class="w-3 h-3 text-muted-foreground transition-transform"
            :class="{ '-rotate-90': !isAcceptanceCriteriaOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Acceptance Criteria</h4>
        </button>
        <div v-if="canInlineEdit && hasAcceptanceCriteriaChanges" class="flex items-center gap-2">
          <Button type="button" size="sm" aria-label="Save acceptance criteria" :disabled="savingField === 'acceptanceCriteria'" @click="saveInlineField('acceptanceCriteria')">
            Save acceptance criteria
          </Button>
          <Button type="button" variant="ghost" size="sm" @click="resetInlineField('acceptanceCriteria')">
            Reset
          </Button>
        </div>
      </div>
      <div v-show="isAcceptanceCriteriaOpen" class="mt-1 pl-4.5">
        <MarkdownEditor
          v-if="canInlineEdit"
          v-model="inlineForm.acceptanceCriteria"
          placeholder="What must be true for this to be done..."
          class="text-xs"
          min-height-class="min-h-24"
          :show-static-toolbar="false"
          :show-bubble-toolbar="true"
        />
        <div v-else class="text-xs"><LinkifiedText :text="issue.acceptanceCriteria" fallback="No acceptance criteria yet." /></div>
      </div>
    </div>

    <!-- Parent Section (only if exists) -->
    <div v-if="issue.parent">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('parent')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isParentOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Parent</h4>
      </button>
      <div v-show="isParentOpen" class="mt-1 pl-4.5">
        <div
          class="flex items-center justify-between gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
          @click="emit('navigate-to-issue', issue.parent.id)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="shrink-0 font-mono text-xs text-foreground hover:underline">{{ issue.parent.id }}</span>
            <span class="text-xs truncate">{{ issue.parent.title }}</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <StatusBadge :status="issue.parent.status" size="sm" />
            <PriorityBadge :priority="issue.parent.priority" size="sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- Children Section (for epics, always show; for others, only if has children) -->
    <div v-if="issue.type === 'epic' || issue.children?.length">
      <div class="flex items-center justify-between">
        <button
          class="flex items-center gap-1.5 text-left group"
          @click="toggleSection('children')"
        >
          <svg
            class="w-3 h-3 text-muted-foreground transition-transform"
            :class="{ '-rotate-90': !isChildrenOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Children</h4>
          <span v-if="issue.children?.length" class="text-[10px] text-muted-foreground">({{ issue.children.length }})</span>
        </button>
        <Button
          v-if="issue.type === 'epic' && !readonly"
          type="button"
          variant="outline"
          size="sm"
          @click="emit('create-child', issue.id)"
        >
          <Plus class="w-3 h-3 mr-1" />
          Create child
        </Button>
      </div>
      <div v-show="isChildrenOpen" class="mt-1 pl-4.5 space-y-0.5">
        <template v-if="sortedChildren.length">
          <div
            v-for="child in sortedChildren"
            :key="child.id"
            class="flex items-center justify-between gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
            @click="emit('navigate-to-issue', child.id)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="shrink-0 font-mono text-xs text-foreground hover:underline">{{ getShortId(child.id) }}</span>
              <span class="text-xs truncate">{{ child.title }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <StatusBadge :status="child.status" size="sm" />
              <PriorityBadge :priority="child.priority" size="sm" />
            </div>
          </div>
        </template>
        <p v-else class="text-xs text-muted-foreground">No children yet</p>
      </div>
    </div>

    <!-- External Reference Section (only if exists) -->
    <div v-if="nonImageRefs.length > 0">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('externalRef')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isExternalRefOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
          External Reference
          <span class="text-muted-foreground">({{ nonImageRefs.length }})</span>
        </h4>
      </button>
      <div v-show="isExternalRefOpen" class="mt-1 pl-4.5 space-y-1">
        <p v-for="(ref, index) in nonImageRefs" :key="index" class="text-xs break-all">
          <LinkifiedText :text="ref" />
        </p>
      </div>
    </div>

    <!-- Dependencies Section -->
    <div v-if="hasDependencies">
      <button
        class="flex items-center gap-1.5 text-left group"
        @click="toggleSection('dependencies')"
      >
          <svg
            class="w-3 h-3 text-muted-foreground transition-transform"
            :class="{ '-rotate-90': !isDependenciesOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Dependencies</h4>
      </button>
      <div v-show="isDependenciesOpen" class="mt-1 pl-4.5 space-y-2">
        <!-- Blocked By -->
        <div v-if="issue.blockedBy?.length">
          <h5 class="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Blocked By</h5>
          <div class="space-y-0.5">
            <div
              v-for="id in sortedBlockedBy"
              :key="id"
              class="group/dep -mx-1 flex cursor-pointer items-center gap-2 rounded border border-border/40 bg-muted/50 px-2 py-1 hover:bg-muted"
              @click="emit('navigate-to-issue', id)"
            >
              <span :class="['text-xs font-mono shrink-0 hover:underline', depTextColor(availableIssues?.find(i => i.id === id)?.priority)]">{{ getShortId(id) }}</span>
              <span v-if="getIssueTitle(id)" class="truncate text-xs text-muted-foreground">{{ getIssueTitle(id) }}</span>
              <span
                v-if="!readonly"
                class="ml-auto opacity-0 group-hover/dep:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                @click.stop="handleRemoveDependency(id, 'blockedBy')"
              >
                <X class="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        <!-- Blocks -->
        <div v-if="issue.blocks?.length">
          <h5 class="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Blocks</h5>
          <div class="space-y-0.5">
            <div
              v-for="id in sortedBlocks"
              :key="id"
              class="group/dep -mx-1 flex cursor-pointer items-center gap-2 rounded border border-border/40 bg-muted/50 px-2 py-1 hover:bg-muted"
              @click="emit('navigate-to-issue', id)"
            >
              <span :class="['text-xs font-mono shrink-0 hover:underline', depTextColor(availableIssues?.find(i => i.id === id)?.priority)]">{{ getShortId(id) }}</span>
              <span v-if="getIssueTitle(id)" class="truncate text-xs text-muted-foreground">{{ getIssueTitle(id) }}</span>
              <span
                v-if="!readonly"
                class="ml-auto opacity-0 group-hover/dep:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                @click.stop="handleRemoveDependency(id, 'blocks')"
              >
                <X class="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estimate Section (only if exists) -->
    <div v-if="issue.estimateMinutes">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('estimate')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isEstimateOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Estimate</h4>
      </button>
      <div v-show="isEstimateOpen" class="mt-1 pl-4.5">
        <p class="text-xs">{{ formatEstimate(issue.estimateMinutes) }}</p>
      </div>
    </div>

    <!-- Design Notes Section (only if exists) -->
    <div v-if="issue.designNotes">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('designNotes')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isDesignNotesOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Design Notes</h4>
      </button>
      <div v-show="isDesignNotesOpen" class="mt-1 pl-4.5">
        <div class="text-xs"><LinkifiedText :text="issue.designNotes" /></div>
      </div>
    </div>


    <!-- Working Notes Section (only if exists) -->
    <div v-if="issue.workingNotes">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('workingNotes')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isWorkingNotesOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Working Notes</h4>
      </button>
      <div v-show="isWorkingNotesOpen" class="mt-1 pl-4.5">
        <div class="text-xs"><LinkifiedText :text="issue.workingNotes" /></div>
      </div>
    </div>

    <!-- Metadata Section (only if exists, read-only JSON) -->
    <div v-if="issue.metadata">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('metadata')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isMetadataOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Metadata</h4>
      </button>
      <div v-show="isMetadataOpen" class="mt-1 pl-4.5">
        <pre class="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">{{ formatMetadata(issue.metadata) }}</pre>
      </div>
    </div>

    <!-- Spec ID Section (only if exists) -->
    <div v-if="issue.specId">
      <button
        class="flex items-center gap-1.5 w-full text-left group"
        @click="toggleSection('specId')"
      >
        <svg
          class="w-3 h-3 text-muted-foreground transition-transform"
          :class="{ '-rotate-90': !isSpecIdOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">Spec ID</h4>
      </button>
      <div v-show="isSpecIdOpen" class="mt-1 pl-4.5">
        <p class="text-xs font-mono">{{ issue.specId }}</p>
      </div>
    </div>
  </div>
</template>
