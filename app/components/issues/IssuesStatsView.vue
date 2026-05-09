<script setup lang="ts">
import type { DashboardStats } from '~/types/issue'
import KpiCard from '~/components/dashboard/KpiCard.vue'
import StatusChart from '~/components/dashboard/StatusChart.vue'
import PriorityChart from '~/components/dashboard/PriorityChart.vue'

type KpiFilter = 'total' | 'open' | 'in_progress' | 'blocked'

defineProps<{
  stats: DashboardStats
  activeKpiFilter: KpiFilter | null
  statusFilters: string[]
}>()

const emit = defineEmits<{
  'kpi-click': [kpi: KpiFilter]
}>()
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold">Issue Stats</h2>
        <p class="text-sm text-muted-foreground">
          Review the project metrics and charts that used to live in the sidebar.
        </p>
      </div>

      <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total" :value="stats.total" :active="activeKpiFilter === null && statusFilters.length === 0" @click="emit('kpi-click', 'total')" />
          <KpiCard title="Open" :value="stats.open" color="var(--color-status-open)" :active="activeKpiFilter === 'open'" @click="emit('kpi-click', 'open')" />
          <KpiCard title="In Progress" :value="stats.inProgress" color="var(--color-status-in-progress)" :active="activeKpiFilter === 'in_progress'" @click="emit('kpi-click', 'in_progress')" />
          <KpiCard title="Blocked" :value="stats.blocked" color="var(--color-status-blocked)" :active="activeKpiFilter === 'blocked'" @click="emit('kpi-click', 'blocked')" />
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <StatusChart :open="stats.open" :closed="stats.closed" />
        </div>
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <PriorityChart :by-priority="stats.byPriority" />
        </div>
      </section>
    </div>
  </div>
</template>
