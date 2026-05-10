<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'
import ImageThumbnail from '~/components/ui/image-preview/ImageThumbnail.vue'
import type { AttachmentFile } from '~/composables/useAttachments'

const props = defineProps<{
  issueId: string
  readonly?: boolean
}>()

const { openGallery } = useImagePreview()
const { openMarkdownGallery } = useMarkdownPreview()
const { listAttachments } = useAttachments()

const emit = defineEmits<{
  'detach-image': [path: string]
}>()

const attachedImages = ref<AttachmentFile[]>([])
const attachedMarkdown = ref<AttachmentFile[]>([])

const loadAttachments = async () => {
  if (!props.issueId) return
  const result = await listAttachments(props.issueId)
  attachedImages.value = result.images
  attachedMarkdown.value = result.markdown
}

watch(() => props.issueId, () => loadAttachments(), { immediate: true })

const totalAttachments = computed(() => attachedImages.value.length + attachedMarkdown.value.length)
const hasAttachments = computed(() => totalAttachments.value > 0)

const preparedImages = computed(() =>
  attachedImages.value.map(img => ({
    path: img.path,
    alt: img.filename,
  })),
)

const preparedMarkdown = computed(() =>
  attachedMarkdown.value.map(md => ({
    path: md.path,
    alt: md.filename,
  })),
)

const handleImageClick = (file: AttachmentFile) => {
  const clickedIndex = preparedImages.value.findIndex(img => img.path === file.path)
  openGallery(preparedImages.value, clickedIndex >= 0 ? clickedIndex : 0)
}

const handleMarkdownClick = (file: AttachmentFile) => {
  const clickedIndex = preparedMarkdown.value.findIndex(md => md.path === file.path)
  openMarkdownGallery(preparedMarkdown.value, clickedIndex >= 0 ? clickedIndex : 0)
}

interface AttachmentsCollapsedState {
  attachments: boolean
}

const attachmentsSection = useProjectStorage<AttachmentsCollapsedState>('issueAttachmentsSection', { attachments: true })

const toggleAttachments = () => {
  const newValue = { attachments: !attachmentsSection.value.attachments }
  attachmentsSection.value = newValue
  saveProjectValue('issueAttachmentsSection', newValue)
}

const isAttachmentsOpen = computed(() => attachmentsSection.value.attachments)
</script>

<template>
  <div v-if="hasAttachments" class="space-y-3">
    <div>
      <button
        class="flex items-center gap-1.5 text-left group"
        @click="toggleAttachments"
      >
          <svg
            class="w-3 h-3 text-muted-foreground transition-transform"
            :class="{ '-rotate-90': !isAttachmentsOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h4 class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
            Attachments
            <span v-if="hasAttachments" class="text-muted-foreground">({{ totalAttachments }})</span>
          </h4>
      </button>
      <div v-show="isAttachmentsOpen" class="mt-2 pl-4.5">
        <div v-if="hasAttachments" class="space-y-3">
          <div v-if="attachedImages.length > 0" class="flex flex-wrap gap-4">
            <ImageThumbnail
              v-for="img in attachedImages"
              :key="img.filename"
              :src="img.path"
              :alt="img.filename"
              :show-remove="!readonly"
              @click="handleImageClick(img)"
              @remove="emit('detach-image', img.filename)"
            />
          </div>
          <div v-if="attachedMarkdown.length > 0" class="space-y-1">
            <div
              v-for="md in attachedMarkdown"
              :key="md.filename"
              class="flex items-center gap-2 group/md"
            >
              <button
                class="flex min-w-0 items-center gap-1.5 text-xs text-foreground hover:underline"
                @click="handleMarkdownClick(md)"
              >
                <FileText class="w-3.5 h-3.5 shrink-0" />
                <span class="truncate">{{ md.filename }}</span>
              </button>
              <button
                v-if="!readonly"
                type="button"
                class="opacity-0 group-hover/md:opacity-100 text-destructive hover:text-destructive/80 transition-all shrink-0"
                @click="emit('detach-image', md.filename)"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
