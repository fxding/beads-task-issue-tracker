<script setup lang="ts">
import type { UpdateIssuePayload } from '~/types/issue'
import AppSidebar from '~/components/AppSidebar.vue'
import FolderPicker from '~/components/dashboard/FolderPicker.vue'
import DebugPanel from '~/components/layout/DebugPanel.vue'
import DialogsLayer from '~/components/layout/DialogsLayer.vue'
import IssueForm from '~/components/details/IssueForm.vue'
import { Button } from '~/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
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
  isLoading,
  fetchIssues,
  createIssue,
  fetchIssue,
  selectIssue,
  clearIssues,
} = useIssues()
const { fetchStats } = useDashboard()
const { success: notifySuccess, error: notifyError } = useNotification()
const { bdDotNotationParent, initRelationTypes } = useIssueDialogs()
const { currentTheme, cycleTheme } = useTheme()
const { showDebugPanel, showSettingsDialog } = useAppMenu()
const { projects } = useProjects()
const { beadsPath, hasStoredPath, setPath } = useBeadsPath()
const { isLeftSidebarOpen, leftSidebarWidth, startResizeLeft } = useSidebarResize()
const isDev = import.meta.dev
const isOnboardingPickerOpen = ref(false)
const appSidebarRef = ref<InstanceType<typeof AppSidebar> | null>(null)

type IssuesView = 'table' | 'list' | 'board' | 'stats'
const activeIssuesView = useProjectStorage<IssuesView>('activeIssuesView', 'table')

const defaultParent = computed(() => {
  const parent = route.query.parent
  return typeof parent === 'string' ? parent : undefined
})

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

const handleOnboardingFolderSelect = async (path: string) => {
  setPath(path)
  await fetchIssues()
}

const handlePathChange = async () => {
  clearIssues()
  await fetchIssues()
}

const handleReset = async () => {
  clearIssues()
  await router.push('/')
}

const handleIssuesViewSelect = async (view: IssuesView) => {
  activeIssuesView.value = view
  await router.push('/')
}

onMounted(async () => {
  await initRelationTypes()
  if (!showOnboarding.value && !issues.value.length) {
    await fetchIssues()
  }
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
      :is-loading="isLoading"
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
      <header class="flex h-16 shrink-0 items-center gap-3 rounded-t border-b border-border/70 bg-background/90 px-4 backdrop-blur">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-1 h-4" />

        <div class="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <span class="truncate text-muted-foreground">{{ currentProjectName || 'Beads Task-Issue Tracker' }}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <Button variant="ghost" size="sm" @click="handleCancel">
                  Issues
                </Button>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New issue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main class="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div v-if="showOnboarding" class="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Choose a workspace from the sidebar to create a new issue.
        </div>

        <div v-else-if="isLoading && !issues.length" class="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
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
