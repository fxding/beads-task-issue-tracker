<script setup lang="ts">
import { FolderKanban } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

const open = defineModel<boolean>('open', { default: false })

const appVersion = useRuntimeConfig().public.appVersion
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader class="space-y-3">
        <div class="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
          <FolderKanban class="size-5 text-muted-foreground" />
        </div>
        <DialogTitle>Beads Task-Issue Tracker</DialogTitle>
        <DialogDescription as="div" class="space-y-3">
          <p class="text-sm text-foreground">Version {{ appVersion }}</p>
          <div class="space-y-1 text-sm text-muted-foreground">
            <p>&copy; 2026 Laurent Chapin</p>
            <p>Powered by beads</p>
          </div>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>
