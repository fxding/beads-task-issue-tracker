<script setup lang="ts">
import { computed } from 'vue'
import { FolderKanban, Link2, Tag, UserRound } from 'lucide-vue-next'
import type { Issue } from '~/types/issue'
import { Button } from '~/components/ui/button'
import LabelBadge from '~/components/issues/LabelBadge.vue'

const props = defineProps<{
  issue: Issue
  readonly?: boolean
}>()

const emit = defineEmits<{
  edit: []
  'navigate-to-issue': [id: string]
}>()

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

const propertySections = computed(() => {
  const sections = [
    {
      key: 'properties',
      title: 'Properties',
      items: [
        {
          key: 'assignee',
          label: 'Assignee',
          value: props.issue.assignee || 'Unassigned',
          empty: !props.issue.assignee,
        },
      ],
    },
    {
      key: 'labels',
      title: 'Labels',
      items: [
        {
          key: 'labels',
          label: 'Add label',
          empty: !props.issue.labels?.length,
        },
      ],
    },
  ]

  if (props.issue.parent) {
    sections.push({
      key: 'project',
      title: 'Project',
      items: [
        {
          key: 'parent',
          label: 'Parent',
          value: props.issue.parent.title,
          empty: false,
        },
      ],
    })
  }

  return sections
})
</script>

<template>
  <aside class="space-y-3">
    <div
      v-for="section in propertySections"
      :key="section.key"
      class="rounded-2xl border border-border/70 bg-card/90 p-4"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h4 class="text-sm font-medium text-foreground">{{ section.title }}</h4>
        <Button
          v-if="!readonly"
          type="button"
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-[11px] text-muted-foreground"
          @click="emit('edit')"
        >
          Edit
        </Button>
      </div>

      <div class="space-y-2">
        <button
          v-for="item in section.items"
          :key="item.key"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60"
          :class="readonly ? 'cursor-default hover:bg-transparent' : ''"
          @click="!readonly && emit('edit')"
        >
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
            <UserRound v-if="item.key === 'assignee'" class="size-3.5" />
            <Tag v-else-if="item.key === 'labels'" class="size-3.5" />
            <FolderKanban v-else class="size-3.5" />
          </span>

          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{{ item.label }}</p>
            <div class="mt-1 min-h-5">
              <div v-if="item.key === 'labels' && issue.labels?.length" class="flex flex-wrap gap-1">
                <LabelBadge v-for="label in issue.labels" :key="label" :label="label" size="sm" />
              </div>
              <p v-else-if="item.key === 'parent' && issue.parent" class="truncate text-xs text-foreground">{{ getShortId(issue.parent.id) }} · {{ issue.parent.title }}</p>
              <p v-else class="truncate text-xs" :class="item.empty ? 'text-muted-foreground' : 'text-foreground'">{{ item.value }}</p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div
      v-if="groupedRelations.length"
      class="rounded-2xl border border-border/70 bg-card/90 p-4"
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
  </aside>
</template>
