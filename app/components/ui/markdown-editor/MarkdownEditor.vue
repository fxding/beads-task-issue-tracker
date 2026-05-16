<script setup lang="ts">
import { computed, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Markdown } from '@tiptap/markdown'
import type { Editor } from '@tiptap/core'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { preprocessEditorMarkdown } from '~/utils/editor-markdown'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  class?: string
  minHeightClass?: string
  showStaticToolbar?: boolean
  showBubbleToolbar?: boolean
}>(), {
  modelValue: '',
  placeholder: '',
  class: '',
  minHeightClass: 'min-h-32',
  showStaticToolbar: true,
  showBubbleToolbar: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'blur'): void
  (e: 'focus'): void
}>()

const lowlight = createLowlight(common)

const editor = useEditor({
  content: preprocessEditorMarkdown(props.modelValue),
  contentType: 'markdown',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2] },
      link: false,
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Link.configure({
      autolink: true,
      linkOnPaste: true,
      openOnClick: false,
      defaultProtocol: 'https',
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Typography,
    Markdown.configure({ indentation: { style: 'space', size: 2 } }),
  ],
  editorProps: {
    attributes: {
      class: 'markdown-editor__content rich-text-editor text-sm outline-none',
    },
  },
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getMarkdown().trimEnd())
  },
  onBlur() {
    emit('blur')
  },
  onFocus() {
    emit('focus')
  },
})

watch(() => props.modelValue, (nextValue) => {
  const instance = editor.value
  if (!instance) return

  const normalized = nextValue ?? ''
  if (instance.getMarkdown().trimEnd() === normalized.trimEnd()) return

  instance.commands.setContent(preprocessEditorMarkdown(normalized), {
    contentType: 'markdown',
    emitUpdate: false,
  })
})

const canToggleLink = computed(() => !!editor.value && !editor.value.isActive('codeBlock'))

function focusEditor() {
  editor.value?.commands.focus()
}

function handleContainerMouseDown(event: MouseEvent) {
  if (event.target !== event.currentTarget) return
  event.preventDefault()
  focusEditor()
}

function toggleParagraph() {
  editor.value?.chain().focus().setParagraph().run()
}

function toggleHeading(level: 1 | 2) {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}

function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}

function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}

function toggleBlockquote() {
  editor.value?.chain().focus().toggleBlockquote().run()
}

function setOrUnsetLink() {
  const instance = editor.value
  if (!instance || !canToggleLink.value) return

  const previousUrl = instance.getAttributes('link').href as string | undefined
  const url = window.prompt('Enter a URL', previousUrl || 'https://')
  if (url === null) return

  const trimmed = url.trim()
  if (!trimmed) {
    instance.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  instance.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
}

function shouldShowBubbleMenu({ editor, from, to }: { editor: Editor; from: number; to: number }) {
  return props.showBubbleToolbar
    && editor.isEditable
    && from !== to
    && !editor.isActive('codeBlock')
}
</script>

<template>
  <div :class="cn('border-input', props.class)">
    <BubbleMenu
      v-if="editor && props.showBubbleToolbar"
      :editor="editor"
      :should-show="shouldShowBubbleMenu"
      :tippy-options="{ duration: 100, placement: 'top' }"
    >
      <div class="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background/95 p-1 shadow-md backdrop-blur">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('paragraph') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleParagraph"
        >
          <Pilcrow class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleHeading(1)"
        >
          <Heading1 class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleHeading(2)"
        >
          <Heading2 class="size-3.5" />
        </Button>
        <div class="mx-1 h-4 w-px bg-border" />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('bold') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleBold"
        >
          <Bold class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('italic') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleItalic"
        >
          <Italic class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleBulletList"
        >
          <List class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('orderedList') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleOrderedList"
        >
          <ListOrdered class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :class="editor?.isActive('blockquote') ? 'bg-accent text-accent-foreground' : ''"
          @click="toggleBlockquote"
        >
          <Quote class="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          :disabled="!canToggleLink"
          :class="editor?.isActive('link') ? 'bg-accent text-accent-foreground' : ''"
          @click="setOrUnsetLink"
        >
          <LinkIcon class="size-3.5" />
        </Button>
      </div>
    </BubbleMenu>

    <div v-if="props.showStaticToolbar" class="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('paragraph') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleParagraph"
      >
        <Pilcrow class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('heading', { level: 1 }) ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleHeading(1)"
      >
        <Heading1 class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('heading', { level: 2 }) ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleHeading(2)"
      >
        <Heading2 class="size-3.5" />
      </Button>
      <div class="mx-1 h-4 w-px bg-border" />
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('bold') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleBold"
      >
        <Bold class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('italic') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleItalic"
      >
        <Italic class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleBulletList"
      >
        <List class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('orderedList') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleOrderedList"
      >
        <ListOrdered class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :class="editor?.isActive('blockquote') ? 'bg-accent text-accent-foreground' : ''"
        @click="toggleBlockquote"
      >
        <Quote class="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        :disabled="!canToggleLink"
        :class="editor?.isActive('link') ? 'bg-accent text-accent-foreground' : ''"
        @click="setOrUnsetLink"
      >
        <LinkIcon class="size-3.5" />
      </Button>
    </div>

    <div
      :class="cn('cursor-text px-0 py-2', props.minHeightClass)"
      @mousedown="handleContainerMouseDown"
    >
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
:deep(.rich-text-editor.ProseMirror) {
  color: var(--foreground);
  min-height: 100%;
}

:deep(.rich-text-editor.ProseMirror:focus) {
  outline: none;
}

:deep(.rich-text-editor .is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.rich-text-editor > *:first-child) {
  margin-top: 0;
}

:deep(.rich-text-editor > *:last-child) {
  margin-bottom: 0;
}

:deep(.rich-text-editor p) {
  margin: 0.5rem 0;
  line-height: 1.55;
}

:deep(.rich-text-editor h1) {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0.875rem 0 0.375rem;
}

:deep(.rich-text-editor h2) {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  margin: 0.875rem 0 0.375rem;
}

:deep(.rich-text-editor ul) {
  list-style: disc;
  margin: 0.5rem 0;
  padding-inline-start: 1.25rem;
}

:deep(.rich-text-editor ol) {
  list-style: decimal;
  margin: 0.5rem 0;
  padding-inline-start: 1.5rem;
}

:deep(.rich-text-editor li) {
  line-height: 1.55;
  margin: 0.2rem 0;
}

:deep(.rich-text-editor li > p) {
  margin: 0;
}

:deep(.rich-text-editor blockquote) {
  border-left: 3px solid var(--border);
  color: var(--muted-foreground);
  margin: 0.75rem 0;
  padding-left: 0.875rem;
}

:deep(.rich-text-editor a) {
  color: var(--primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

:deep(.rich-text-editor code) {
  background: color-mix(in srgb, var(--foreground) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent);
  border-radius: 0.375rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  padding: 0.1rem 0.3rem;
}

:deep(.rich-text-editor pre) {
  background: var(--muted);
  border-radius: var(--radius);
  margin: 0.75rem 0;
  overflow-x: auto;
  padding: 0.75rem 1rem;
}

:deep(.rich-text-editor pre code) {
  background: transparent;
  border: 0;
  padding: 0;
}
</style>
