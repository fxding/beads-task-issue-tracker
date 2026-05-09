<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import type { Component } from 'vue'

import {
  Activity,
  Bug,
  FolderKanban,
  Github,
  KanbanSquare,
  ListTodo,
  Moon,
  RefreshCcw,
  Settings2,
  Sparkles,
  Square,
  Sun,
  TableProperties,
  Zap,
} from 'lucide-vue-next'
import PathSelector from '@/components/dashboard/PathSelector.vue'
import OnboardingCard from '@/components/dashboard/OnboardingCard.vue'
import { Badge } from '@/components/ui/badge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type IssuesView = 'table' | 'list' | 'board' | 'stats'

const props = withDefaults(defineProps<SidebarProps & {
  activeView: IssuesView
  showOnboarding: boolean
  isLoading?: boolean
  projectName?: string
  currentTheme: {
    label: string
    icon: string
  }
  showDebugPanel: boolean
  probeEnabled: boolean
  isDev: boolean
}>(), {
  collapsible: 'icon',
  variant: 'inset',
})

const emit = defineEmits<{
  browse: []
  change: []
  reset: []
  'open-github': []
  'open-settings': []
  refresh: []
  'resize-start': [event: MouseEvent]
  'select-view': [view: IssuesView]
  'toggle-debug': []
  'cycle-theme': []
}>()

const pathSelectorRef = ref<InstanceType<typeof PathSelector> | null>(null)

const viewItems: Array<{
  id: IssuesView
  label: string
  description: string
  icon: Component
  badge?: string
}> = [
  { id: 'table', label: 'Table', description: 'Browse the full issue grid.', icon: TableProperties },
  { id: 'list', label: 'List', description: 'Scan ready, pinned, and active work.', icon: ListTodo },
  { id: 'board', label: 'Board', description: 'Track the planned kanban surface.', icon: KanbanSquare, badge: 'Plan' },
  { id: 'stats', label: 'Stats', description: 'Watch project health and trends.', icon: Activity },
]

const themeIcon = computed<Component>(() => {
  switch (props.currentTheme.icon) {
    case 'sun':
      return Sun
    case 'moon':
      return Moon
    case 'square':
      return Square
    default:
      return Zap
  }
})

const utilityItems = computed<Array<{
  id: 'refresh' | 'theme' | 'debug' | 'settings' | 'github'
  label: string
  icon: Component
  hidden?: boolean
  active?: boolean
}>>(() => {
  const items: Array<{
    id: 'refresh' | 'theme' | 'debug' | 'settings' | 'github'
    label: string
    icon: Component
    hidden?: boolean
    active?: boolean
  }> = [
    { id: 'refresh', label: 'Refresh issues', icon: RefreshCcw, hidden: props.showOnboarding },
    { id: 'theme', label: props.currentTheme.label, icon: themeIcon.value },
    { id: 'debug', label: 'Debug panel', icon: Bug, active: props.showDebugPanel },
    { id: 'settings', label: 'Settings', icon: Settings2 },
    { id: 'github', label: 'Project repository', icon: Github },
  ]

  return items.filter(item => !item.hidden)
})

const openProjectPicker = () => {
  const selector = pathSelectorRef.value
  if (selector) {
    selector.isPickerOpen = true
    return
  }

  emit('browse')
}

const handleUtilityClick = (id: 'refresh' | 'theme' | 'debug' | 'settings' | 'github') => {
  switch (id) {
    case 'refresh':
      emit('refresh')
      return
    case 'theme':
      emit('cycle-theme')
      return
    case 'debug':
      emit('toggle-debug')
      return
    case 'settings':
      emit('open-settings')
      return
    case 'github':
      emit('open-github')
      return
  }
}

defineExpose({
  openProjectPicker,
})
</script>

<template>
  <Sidebar :side="side" :variant="variant" :collapsible="collapsible">
    <div class="relative flex h-full w-full flex-col">
      <SidebarHeader class="border-sidebar-border/70 border-b px-2 py-3">
        <div class="flex items-center gap-3 px-2">
          <div class="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <FolderKanban class="size-5" />
          </div>
          <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p class="truncate text-sm font-semibold">
              {{ projectName || 'Beads Task-Issue Tracker' }}
            </p>
            <p class="truncate text-xs text-sidebar-foreground/70">
              {{ showOnboarding ? 'Choose a workspace to begin.' : 'Sidebar-07 powered issue cockpit.' }}
            </p>
          </div>
        </div>

        <div class="px-2 pt-3 group-data-[collapsible=icon]:hidden">
          <PathSelector
            v-if="!showOnboarding"
            ref="pathSelectorRef"
            :is-loading="isLoading"
            @change="emit('change')"
            @reset="emit('reset')"
          />
          <OnboardingCard v-else @browse="emit('browse')" />
        </div>
      </SidebarHeader>

      <SidebarContent class="px-2 py-3">
        <SidebarGroup v-if="!showOnboarding">
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in viewItems" :key="item.id">
                <SidebarMenuButton
                  :is-active="activeView === item.id"
                  :tooltip="item.label"
                  class="h-12"
                  @click="emit('select-view', item.id)"
                >
                  <component :is="item.icon" />
                  <div class="flex min-w-0 flex-1 items-center gap-2 group-data-[collapsible=icon]:hidden">
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium">{{ item.label }}</p>
                      <p class="truncate text-xs text-sidebar-foreground/70">{{ item.description }}</p>
                    </div>
                    <Badge
                      v-if="item.badge"
                      variant="secondary"
                      class="border-sidebar-border/80 bg-sidebar-accent text-[10px] uppercase tracking-wide"
                    >
                      {{ item.badge }}
                    </Badge>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup v-else class="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Get Started</SidebarGroupLabel>
          <SidebarGroupContent>
            <div class="rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar-accent/25 p-3 text-sm text-sidebar-foreground/80">
              Pick a beads workspace to unlock the table, list, board, and stats views.
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter class="border-sidebar-border/70 border-t px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem v-for="item in utilityItems" :key="item.id">
            <SidebarMenuButton
              :is-active="item.active"
              :tooltip="item.label"
              @click="handleUtilityClick(item.id)"
            >
              <component :is="item.icon" />
              <span class="group-data-[collapsible=icon]:hidden">{{ item.label }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div
          v-if="probeEnabled && isDev"
          class="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 group-data-[collapsible=icon]:justify-center"
        >
          <Sparkles class="size-4" />
          <span class="group-data-[collapsible=icon]:hidden">Probe broadcasting enabled</span>
        </div>
      </SidebarFooter>

      <div
        class="absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize rounded-full transition-colors hover:bg-sidebar-ring/40 md:block group-data-[collapsible=icon]:hidden"
        @mousedown="emit('resize-start', $event)"
      />
    </div>
    <SidebarRail />
  </Sidebar>
</template>
