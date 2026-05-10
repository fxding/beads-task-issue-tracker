<script setup lang="ts">
import type { UpdateIssuePayload } from '~/types/issue'
import IssueForm from '~/components/details/IssueForm.vue'
import { Button } from '~/components/ui/button'

const route = useRoute()
const router = useRouter()

const {
  issues,
  isLoading,
  fetchIssues,
  createIssue,
  fetchIssue,
  selectIssue,
} = useIssues()
const { fetchStats } = useDashboard()
const { success: notifySuccess, error: notifyError } = useNotification()
const { bdDotNotationParent, initRelationTypes } = useIssueDialogs()

const defaultParent = computed(() => {
  const parent = route.query.parent
  return typeof parent === 'string' ? parent : undefined
})

const availableLabels = computed(() => {
  const labelSet = new Set<string>()
  issues.value.forEach((issue) => {
    issue.labels?.forEach(label => labelSet.add(label))
  })
  return Array.from(labelSet).sort()
})

const availableEpics = computed(() => {
  return issues.value
    .filter(issue => issue.type === 'epic' && issue.status !== 'closed')
    .map(issue => ({ id: issue.id, title: issue.title }))
})

const handleCancel = async () => {
  if (defaultParent.value) {
    await router.push(`/issues/${encodeURIComponent(defaultParent.value)}`)
    return
  }

  await router.push('/')
}

const handleSaveIssue = async (payload: UpdateIssuePayload) => {
  try {
    const parentId = payload.parent || defaultParent.value
    const result = await createIssue({
      title: payload.title || '',
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      assignee: payload.assignee,
      labels: payload.labels,
      externalRef: payload.externalRef,
      estimateMinutes: payload.estimateMinutes,
      designNotes: payload.designNotes,
      acceptanceCriteria: payload.acceptanceCriteria,
      workingNotes: payload.workingNotes,
      parent: parentId || undefined,
    })

    if (!result) {
      notifyError('Failed to create issue')
      return
    }

    selectIssue(result)
    await fetchIssue(result.id)
    await fetchStats(issues.value)
    notifySuccess('Issue created')
    await router.replace(`/issues/${encodeURIComponent(result.id)}`)
  } catch {
    notifyError('Failed to create issue')
  }
}

onMounted(async () => {
  await initRelationTypes()
  if (!issues.value.length) {
    await fetchIssues()
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b border-border/70 bg-background/95 backdrop-blur">
      <div class="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4">
        <Button variant="ghost" size="sm" @click="handleCancel">
          <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Button>
        <div>
          <p class="text-sm font-medium text-foreground">New issue</p>
          <p class="text-xs text-muted-foreground">
            Create an issue on its own page instead of in the side panel.
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl px-4 py-6">
      <div v-if="isLoading && !issues.length" class="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Loading issue context...
      </div>

      <div v-else class="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <IssueForm
          :issue="null"
          :is-new="true"
          :is-saving="isLoading"
          :available-epics="availableEpics"
          :available-labels="availableLabels"
          :default-parent="defaultParent"
          :dot-notation-parent="bdDotNotationParent"
          @save="handleSaveIssue"
          @cancel="handleCancel"
        />
      </div>
    </main>
  </div>
</template>
