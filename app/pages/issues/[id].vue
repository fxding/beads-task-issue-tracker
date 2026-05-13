<script setup lang="ts">
import { Check, Copy, Ellipsis, Link2, Paperclip, ShieldAlert } from 'lucide-vue-next'
import type { Issue, UpdateIssuePayload } from '~/types/issue'
import AppSidebar from '~/components/AppSidebar.vue'
import FolderPicker from '~/components/dashboard/FolderPicker.vue'
import IssueDetailHeader from '~/components/details/IssueDetailHeader.vue'
import IssuePropertiesPanel from '~/components/details/IssuePropertiesPanel.vue'
import IssuePreview from '~/components/details/IssuePreview.vue'
import IssueAttachmentsSection from '~/components/details/IssueAttachmentsSection.vue'
import IssueForm from '~/components/details/IssueForm.vue'
import CommentSection from '~/components/details/CommentSection.vue'
import DebugPanel from '~/components/layout/DebugPanel.vue'
import DialogsLayer from '~/components/layout/DialogsLayer.vue'
import { Button } from '~/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { openUrl } from '~/utils/open-url'

const route = useRoute()
const router = useRouter()

const {
  issues,
  selectedIssue,
  isLoading,
  isUpdating,
  fetchIssues,
  fetchIssue,
  updateIssue,
  selectIssue,
  addComment,
  clearIssues,
} = useIssues()
const { fetchStats } = useDashboard()
const { success: notifySuccess, error: notifyError } = useNotification()
const { isPinned, togglePin } = usePinnedIssues()
const { currentTheme, cycleTheme } = useTheme()
const { showDebugPanel, showSettingsDialog } = useAppMenu()
const {
  handleDeleteIssue,
  handleCloseIssue,
  handleReopenIssue,
  handleAttachImage,
  openAttachmentDialog,
  confirmDetachImage,
  confirmRemoveDependency,
  openAddBlockerDialog,
  openAddRelationDialog,
  confirmRemoveRelation,
  availableIssuesForDeps,
  bdDotNotationParent,
  initRelationTypes,
} = useIssueDialogs()
const { projects } = useProjects()
const { beadsPath, hasStoredPath, setPath } = useBeadsPath()
const { isLeftSidebarOpen, leftSidebarWidth, startResizeLeft } = useSidebarResize()
const isDev = import.meta.dev

const isEditMode = ref(false)
const isPageLoading = ref(true)
const isOnboardingPickerOpen = ref(false)
const appSidebarRef = ref<InstanceType<typeof AppSidebar> | null>(null)
const copiedIssueId = ref(false)

type IssuesView = 'table' | 'list' | 'board' | 'stats'
const activeIssuesView = useProjectStorage<IssuesView>('activeIssuesView', 'table')
const issuesViewMeta: Record<IssuesView, { label: string }> = {
  table: { label: 'Table' },
  list: { label: 'List' },
  board: { label: 'Board' },
  stats: { label: 'Stats' },
}
const breadcrumbSectionLabel = computed(() => issuesViewMeta[activeIssuesView.value]?.label || 'Issues')

const issueId = computed(() => decodeURIComponent(String(route.params.id ?? '')))
const currentIssue = computed<Issue | null>(() =>
  selectedIssue.value?.id === issueId.value ? selectedIssue.value : null,
)
const currentProjectName = computed(() => {
  const project = projects.value.find(f => f.path === beadsPath.value)
  return project?.name
})
const showOnboarding = computed(() => projects.value.length === 0 && !hasStoredPath.value)
const sidebarProviderStyle = computed<Record<string, string>>(() => ({
  '--sidebar-width': `${leftSidebarWidth.value}px`,
  '--sidebar-width-icon': '3.5rem',
}))

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

const syncEditModeFromRoute = () => {
  isEditMode.value = route.query.edit === '1'
}

const goBackToList = async () => {
  selectIssue(null)
  await router.push('/')
}

const loadIssue = async () => {
  if (showOnboarding.value) {
    isPageLoading.value = false
    return
  }

  isPageLoading.value = true
  try {
    if (!issues.value.length) {
      await fetchIssues()
    }

    const issue = await fetchIssue(issueId.value)
    syncEditModeFromRoute()

    if (!issue) {
      await goBackToList()
    }
  } finally {
    isPageLoading.value = false
  }
}

const clearEditQuery = async () => {
  const nextQuery = { ...route.query }
  delete nextQuery.edit
  await router.replace({ query: nextQuery })
}

const handleEditIssue = async () => {
  isEditMode.value = true
  await router.replace({
    query: {
      ...route.query,
      edit: '1',
    },
  })
}

const handleCancelEdit = async () => {
  isEditMode.value = false
  await clearEditQuery()
}

const handleSaveIssue = async (payload: UpdateIssuePayload) => {
  if (!currentIssue.value) return

  try {
    await updateIssue(currentIssue.value.id, payload)
    await fetchIssue(currentIssue.value.id)
    await fetchStats(issues.value)
    await clearEditQuery()
    isEditMode.value = false
    notifySuccess('Issue saved')
  } catch {
    notifyError('Failed to save issue')
  }
}

const handleAddComment = async (content: string) => {
  if (!currentIssue.value) return

  try {
    await addComment(currentIssue.value.id, content)
    notifySuccess('Comment added')
  } catch {
    notifyError('Failed to add comment')
  }
}

const handleNavigateToIssue = async (id: string) => {
  await router.push(`/issues/${encodeURIComponent(id)}`)
}

const handleCreateChild = async (parentId: string) => {
  await router.push({
    path: '/issues/new',
    query: { parent: parentId },
  })
}

const openFolderPicker = () => {
  if (!showOnboarding.value) {
    appSidebarRef.value?.openProjectPicker?.()
    return
  }

  isOnboardingPickerOpen.value = true
}

const openProjectGithub = () => {
  openUrl('https://github.com/w3dev33/beads-task-issue-tracker')
}

const handleRefresh = () => {
  window.location.reload()
}

const handleCopyIssueId = async () => {
  if (!currentIssue.value) return

  try {
    await navigator.clipboard.writeText(currentIssue.value.id)
    copiedIssueId.value = true
    notifySuccess('Issue ID copied', currentIssue.value.id)
    setTimeout(() => {
      copiedIssueId.value = false
    }, 2000)
  } catch {
    notifyError('Failed to copy issue ID')
  }
}

const handleOnboardingFolderSelect = async (path: string) => {
  setPath(path)
  await fetchIssues()
  await loadIssue()
}

const handlePathChange = async () => {
  selectIssue(null)
  clearIssues()
  await fetchIssues()
  await loadIssue()
}

const handleReset = async () => {
  clearIssues()
  selectIssue(null)
  await router.push('/')
}

const handleIssuesViewSelect = async (view: IssuesView) => {
  activeIssuesView.value = view
  await router.push('/')
}

watch(issueId, async () => {
  await loadIssue()
})

watch(() => route.query.edit, () => {
  syncEditModeFromRoute()
})

watch(currentIssue, async (issue) => {
  if (!issue && !isPageLoading.value && !showOnboarding.value) {
    await goBackToList()
  }
})

onMounted(async () => {
  await initRelationTypes()
  await loadIssue()
})
</script>

<template>
  <SidebarProvider
    :open="isLeftSidebarOpen"
    class="fixed inset-0"
    :style="sidebarProviderStyle"
    @update:open="isLeftSidebarOpen = $event"
  >
    <AppSidebar
      ref="appSidebarRef"
      :active-view="activeIssuesView"
      :show-onboarding="showOnboarding"
      :is-loading="isLoading || isPageLoading"
      :project-name="currentProjectName"
      :current-theme="currentTheme"
      :show-debug-panel="showDebugPanel"
      :probe-enabled="false"
      :is-dev="isDev"
      @browse="openFolderPicker"
      @change="handlePathChange"
      @reset="handleReset"
      @select-view="handleIssuesViewSelect"
      @refresh="handleRefresh"
      @cycle-theme="cycleTheme"
      @toggle-debug="showDebugPanel = !showDebugPanel"
      @open-settings="showSettingsDialog = true"
      @open-github="openProjectGithub"
      @resize-start="startResizeLeft"
    />

    <SidebarInset class="min-w-0 bg-background">
      <header class="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur rounded-t">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-1 h-4!" />

        <div class="min-w-0 flex flex-1 items-center gap-2">
          <Breadcrumb class="min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <span class="truncate text-muted-foreground">{{ currentProjectName || 'Beads Task-Issue Tracker' }}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <Button variant="ghost" size="sm" @click="goBackToList">
                  {{ breadcrumbSectionLabel }}
                </Button>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{{ currentIssue?.id || 'Issue details' }}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            v-if="currentIssue"
            variant="ghost"
            size="icon-sm"
            class="h-8 w-8 shrink-0"
            :aria-label="copiedIssueId ? 'Issue ID copied' : 'Copy issue ID'"
            :title="copiedIssueId ? 'Copied' : `Copy ${currentIssue.id}`"
            @click="handleCopyIssueId"
          >
            <Check v-if="copiedIssueId" class="h-3.5 w-3.5 text-green-500" />
            <Copy v-else class="h-3.5 w-3.5" />
          </Button>
        </div>

        <div v-if="currentIssue && !isEditMode" class="flex items-center gap-1.5">
          <Button
            :variant="isPinned(currentIssue.id) ? 'secondary' : 'ghost'"
            size="icon-sm"
            class="h-8 w-8 shrink-0"
            :aria-label="isPinned(currentIssue.id) ? 'Unpin issue' : 'Pin issue'"
            @click="togglePin(currentIssue.id)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" :fill="isPinned(currentIssue.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 4v6l-2 4h10l-2-4V4" /><line x1="12" y1="16" x2="12" y2="21" /><line x1="8" y1="4" x2="16" y2="4" />
            </svg>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm" class="h-8 w-8 shrink-0" aria-label="More actions">
                <Ellipsis class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem v-if="currentIssue.status !== 'closed'" @select="openAttachmentDialog">
                <Paperclip class="mr-2 h-3.5 w-3.5" />
                Attach file
              </DropdownMenuItem>
              <DropdownMenuItem v-if="currentIssue.status !== 'closed'" @select="openAddBlockerDialog(currentIssue.id)">
                <ShieldAlert class="mr-2 h-3.5 w-3.5" />
                Add blocker
              </DropdownMenuItem>
              <DropdownMenuItem v-if="currentIssue.status !== 'closed'" @select="openAddRelationDialog(currentIssue.id)">
                <Link2 class="mr-2 h-3.5 w-3.5" />
                Create related
              </DropdownMenuItem>
              <DropdownMenuItem v-if="currentIssue.status !== 'closed'" @select="handleCloseIssue">
                <svg class="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Close
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive focus:text-destructive" @select="handleDeleteIssue">
                <svg class="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main class="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col overflow-hidden px-4 py-6">
        <div v-if="showOnboarding" class="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Choose a workspace from the sidebar to view issue details.
        </div>

        <div v-else-if="isPageLoading && !currentIssue" class="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Loading issue details...
        </div>

        <div v-else-if="currentIssue" class="flex-1 min-h-0 overflow-hidden">
          <div v-if="isEditMode" class="h-full min-h-[70vh] overflow-hidden p-4">
            <IssueForm
              :issue="currentIssue"
              :is-new="false"
              :is-saving="isUpdating"
              :available-epics="availableEpics"
              :available-labels="availableLabels"
              :dot-notation-parent="bdDotNotationParent"
              @save="handleSaveIssue"
              @cancel="handleCancelEdit"
            />
          </div>

          <div v-else class="mx-auto grid h-full min-h-0 w-full max-w-6xl gap-4 overflow-hidden pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <ScrollArea class="h-full min-h-0">
              <div class="space-y-3 pr-1">
                <IssueDetailHeader
                  :selected-issue="currentIssue"
                  :readonly="currentIssue.status === 'closed'"
                  @save-inline="handleSaveIssue"
                  @reopen="handleReopenIssue"
                />
                <IssuePreview
                  :issue="currentIssue"
                  :readonly="currentIssue.status === 'closed'"
                  :available-issues="availableIssuesForDeps"
                  @navigate-to-issue="handleNavigateToIssue"
                  @save-inline="handleSaveIssue"
                  @create-child="handleCreateChild"
                  @open-add-blocker="openAddBlockerDialog"
                  @remove-dependency="confirmRemoveDependency"
                />
                <IssueAttachmentsSection
                  :issue-id="currentIssue.id"
                  :readonly="currentIssue.status === 'closed'"
                  @detach-image="confirmDetachImage"
                />
                <CommentSection
                  :comments="currentIssue.comments || []"
                  :readonly="currentIssue.status === 'closed'"
                  @add-comment="handleAddComment"
                />
              </div>
            </ScrollArea>

            <div class="lg:sticky lg:top-4 lg:justify-self-end lg:w-[320px]">
              <IssuePropertiesPanel
                :issue="currentIssue"
                :readonly="currentIssue.status === 'closed'"
                @edit="handleEditIssue"
                @navigate-to-issue="handleNavigateToIssue"
              />
            </div>
          </div>
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>

  <DebugPanel v-model:is-open="showDebugPanel" />
  <DialogsLayer />
  <FolderPicker
    v-model:open="isOnboardingPickerOpen"
    current-path="~"
    @select="handleOnboardingFolderSelect"
  />
</template>
