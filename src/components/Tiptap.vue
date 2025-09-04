<template>
  <div class="tiptap-editor">
    <div class="editor-toolbar">
      <div class="toolbar-section">
        <v-tooltip location="bottom" text="标题 1">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('heading', { level: 1 }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="clickH1"
            >
              <v-icon>mdi-format-header-1</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="标题 2">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('heading', { level: 2 }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="clickH2"
            >
              <v-icon>mdi-format-header-2</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="标题 3">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('heading', { level: 3 }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="clickH3"
            >
              <v-icon>mdi-format-header-3</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="粗体">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('bold') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="clickBold"
            >
              <v-icon>mdi-format-bold</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="斜体">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('italic') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="clickItalic"
            >
              <v-icon>mdi-format-italic</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="下划线">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('underline') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setUnderline"
            >
              <v-icon>mdi-format-underline</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="删除线">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('strike') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setStrike"
            >
              <v-icon>mdi-format-strikethrough</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="左对齐">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('textAlign', { textAlign: 'left' }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setLeft"
            >
              <v-icon>mdi-format-align-left</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="居中对齐">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('textAlign', { textAlign: 'center' }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setCenter"
            >
              <v-icon>mdi-format-align-center</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="右对齐">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('textAlign', { textAlign: 'right' }) }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setRight"
            >
              <v-icon>mdi-format-align-right</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="有序列表">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('orderedList') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setOrderedList"
            >
              <v-icon>mdi-format-list-numbered</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="无序列表">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('bulletList') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setListItem"
            >
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="引用块">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('blockquote') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setBlockquote"
            >
              <v-icon>mdi-format-quote-open</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="代码块">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('codeBlock') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setCodeBlock"
            >
              <v-icon>mdi-code-tags</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="水平线">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('horizontalRule') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setHorizontal"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="上标">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('superscript') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setSuper"
            >
              <v-icon>mdi-format-superscript</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="下标">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('subscript') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="setSub"
            >
              <v-icon>mdi-format-subscript</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-divider vertical class="mx-2"></v-divider>
      </div>

      <div class="toolbar-section">
        <v-tooltip location="bottom" text="插入链接">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                :class="{ 'is-active': isActive('link') }"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="showDialog"
            >
              <v-icon>mdi-link-variant</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom" text="插入图片">
          <template v-slot:activator="{ props }">
            <v-btn
                v-bind="props"
                class="toolbar-btn"
                variant="text"
                density="comfortable"
                @click="uploadImage"
            >
              <v-icon>mdi-image-plus</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <input
            type="file"
            ref="imageInput"
            accept="image/*"
            style="display: none"
            @change="onImageSelected"
        />
      </div>
    </div>

    <div class="editor-container">
      <editor-content :editor="editor" class="editor-content"/>
    </div>

    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          插入链接
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
              v-model="linkUrl"
              label="链接地址"
              placeholder="请输入链接地址 (例如: https://example.com)"
              variant="outlined"
              prepend-inner-icon="mdi-link-variant"
              :rules="[rules.url]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="text" @click="confirmLink">
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="codeBlockDialogVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          选择代码语言
        </v-card-title>
        <v-card-text class="pt-4">
          <v-select
            v-model="selectedLanguage"
            label="编程语言"
            :items="supportedLanguages"
            item-title="text"
            item-value="value"
            variant="outlined"
            prepend-inner-icon="mdi-code-tags"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="codeBlockDialogVisible = false">
            取消
          </v-btn>
          <v-btn color="primary" variant="text" @click="confirmCodeBlock">
            确认
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlock from '@tiptap/extension-code-block'
import { Extension } from '@tiptap/core'

const MAX_AVATAR_SIZE = 10000000

const rules = {
  url(value) {
    if (!value) return true
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    return pattern.test(value) || '请输入有效的URL'
  }
}

const editor = ref(null)
const imageInput = ref(null)
const dialogVisible = ref(false)
const linkUrl = ref('')
const codeBlockDialogVisible = ref(false)
const selectedLanguage = ref('javascript')

// 支持的编程语言列表
const supportedLanguages = [
  { value: 'javascript', text: 'JavaScript' },
  { value: 'typescript', text: 'TypeScript' },
  { value: 'html', text: 'HTML' },
  { value: 'css', text: 'CSS' },
  { value: 'python', text: 'Python' },
  { value: 'java', text: 'Java' },
  { value: 'cpp', text: 'C++' },
  { value: 'json', text: 'JSON' },
  { value: 'bash', text: 'Bash/Shell' },
  { value: 'sql', text: 'SQL' },
  { value: 'text', text: '纯文本' }
]

editor.value = new Editor({
  extensions: [
    StarterKit.configure({
      // 使用默认的代码块，但自定义其行为
      codeBlock: false,
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Superscript,
    Subscript,
    Link.configure({
      openOnClick: true,
      validate: href => /^https?:\/\//.test(href),
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    CodeBlock.configure({
      languageClassPrefix: 'language-',
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
  ],
  content: '',
  onUpdate: () => {
    // You can emit an event here if you need to track content changes
  },
  editorProps: {
    attributes: {
      class: 'editor-content',
    },
  },
})

function isActive(type, attrs = {}) {
  return editor.value && editor.value.isActive(type, attrs)
}

function clickH1() {
  editor.value.chain().focus().toggleHeading({ level: 1 }).run()
}

function clickH2() {
  editor.value.chain().focus().toggleHeading({ level: 2 }).run()
}

function clickH3() {
  editor.value.chain().focus().toggleHeading({ level: 3 }).run()
}

function clickBold() {
  editor.value.chain().focus().toggleBold().run()
}

function clickItalic() {
  editor.value.chain().focus().toggleItalic().run()
}

function setStrike() {
  editor.value.chain().focus().toggleStrike().run()
}

function setOrderedList() {
  editor.value.chain().focus().toggleOrderedList().run()
}

function setListItem() {
  editor.value.chain().focus().toggleBulletList().run()
}

function setHorizontal() {
  editor.value.chain().focus().setHorizontalRule().run()
}

function setBlockquote() {
  editor.value.chain().focus().toggleBlockquote().run()
}

function setCodeBlock() {
  // 打开代码块语言选择对话框
  codeBlockDialogVisible.value = true
}

function confirmCodeBlock() {
  // 根据选择的语言创建代码块
  editor.value.chain().focus().toggleCodeBlock({ language: selectedLanguage.value }).run()
  codeBlockDialogVisible.value = false
}

function setSuper() {
  editor.value.chain().focus().toggleSuperscript().run()
}

function setSub() {
  editor.value.chain().focus().toggleSubscript().run()
}

function setUnderline() {
  editor.value.chain().focus().toggleUnderline().run()
}

function setRight() {
  editor.value.chain().focus().setTextAlign('right').run()
}

function setLeft() {
  editor.value.chain().focus().setTextAlign('left').run()
}

function setCenter() {
  editor.value.chain().focus().setTextAlign('center').run()
}

function uploadImage() {
  imageInput.value.click()
}

function onImageSelected(event) {
  const file = event.target.files[0]
  if (file) {
    setImage(file)
  }
}

function setImage(file) {
  if (file.size > MAX_AVATAR_SIZE) {
    alert('图片大小不能超过10MB')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    const result = e.target.result
    editor.value.chain().focus().setImage({ src: result }).run()
  }
  reader.readAsDataURL(file)
}

function showDialog() {
  dialogVisible.value = true
  linkUrl.value = ''
}

function confirmLink() {
  if (linkUrl.value && rules.url(linkUrl.value) === true) {
    editor.value.chain().focus().setLink({ href: linkUrl.value }).run()
    dialogVisible.value = false
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.tiptap-editor {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  background-color: #f9f9f9;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 4px;
  align-items: center;
}

.toolbar-section {
  display: flex;
  align-items: center;
}

.toolbar-btn {
  min-width: 36px !important;
  height: 36px !important;
  border-radius: 4px !important;
  margin: 0 2px !important;
  color: rgba(0, 0, 0, 0.7) !important;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.toolbar-btn.is-active {
  color: var(--v-primary-base) !important;
  background-color: rgba(var(--v-primary-base), 0.1) !important;
}

.editor-container {
  position: relative;
}

.editor-content {
  min-height: 300px;
  padding: 16px;
  background: #fff;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #333;
  line-height: 1.6;
}

.editor-content:focus {
  outline: none;
}

/* 移除编辑器内容的所有元素的黑框 */
.editor-content * {
  outline: none !important;
}

/* 移除可编辑内容的黑框 */
.editor-content [contenteditable] {
  outline: none !important;
  -webkit-tap-highlight-color: transparent;
}

/* 移除选择时的黑框 */
.editor-content ::selection {
  background-color: rgba(25, 118, 210, 0.2); /* 使用主题色的淡化版本 */
  color: inherit;
}

/* 移除焦点时的黑框 */
.editor-content:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* 移除ProseMirror编辑器的默认聚焦样式 */
.ProseMirror:focus {
  outline: none !important;
}

.ProseMirror-focused {
  outline: none !important;
  box-shadow: none !important;
}

/* 移除所有可能的选择和聚焦样式 */
.ProseMirror * {
  outline: none !important;
  -webkit-tap-highlight-color: transparent;
}

.editor-content h1 {
  font-size: 1.75em;
  margin: 0.75em 0 0.5em;
  font-weight: 600;
}

.editor-content h2 {
  font-size: 1.5em;
  margin: 0.75em 0 0.5em;
  font-weight: 600;
}

.editor-content h3 {
  font-size: 1.25em;
  margin: 0.75em 0 0.5em;
  font-weight: 600;
}

.editor-content blockquote {
  border-left: 3px solid var(--v-primary-base, #1976d2);
  padding-left: 1em;
  margin-left: 0;
  color: #555;
  font-style: italic;
}

/* 代码块样式 - 修复 */
.editor-content pre {
  background-color: #2d2d2d !important;
  color: #f8f8f2 !important;
  padding: 1rem !important;
  border-radius: 6px !important;
  font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
  margin: 0.75em 0 !important;
  overflow-x: auto !important;
  position: relative !important;
  white-space: pre !important;
}

/* 代码块语言标签 */
.editor-content pre::before {
  content: attr(data-language);
  text-transform: uppercase;
  font-size: 0.7rem;
  font-family: sans-serif;
  color: #888;
  position: absolute;
  top: 0.3rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.editor-content code {
  background: #f0f0f0;
  color: #333;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.9em;
}

.editor-content pre code {
  background: transparent !important;
  color: #f8f8f2 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: 'Fira Code', 'JetBrains Mono', monospace !important;
  font-size: 0.9em !important;
  white-space: pre !important;
}

/* 确保代码块有正确的样式 */
.editor-content .code-block {
  background-color: #2d2d2d !important;
  color: #f8f8f2 !important;
  border-radius: 6px !important;
  position: relative !important;
}

/* 确保语法高亮正确应用 */
:deep(.editor-content pre) {
  background-color: #2d2d2d !important;
  color: #f8f8f2 !important;
}

:deep(.editor-content pre code) {
  background: transparent !important;
  color: #f8f8f2 !important;
}

/* 语法高亮样式 */
:deep(.language-javascript),
:deep(.language-js) {
  color: #f8f8f2 !important;
}

:deep(.language-javascript .keyword),
:deep(.language-js .keyword) {
  color: #c678dd !important;
}

:deep(.language-javascript .string),
:deep(.language-js .string) {
  color: #98c379 !important;
}

:deep(.language-javascript .comment),
:deep(.language-js .comment) {
  color: #7f848e !important;
  font-style: italic !important;
}

:deep(.language-javascript .number),
:deep(.language-js .number) {
  color: #d19a66 !important;
}

:deep(.language-javascript .function),
:deep(.language-js .function) {
  color: #61aeee !important;
}

:deep(.language-html .tag) {
  color: #e06c75 !important;
}

:deep(.language-html .attr-name) {
  color: #d19a66 !important;
}

:deep(.language-html .attr-value) {
  color: #98c379 !important;
}

:deep(.language-css .property) {
  color: #e06c75 !important;
}

:deep(.language-css .value) {
  color: #d19a66 !important;
}

.editor-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  margin: 1em auto;
}

.editor-content ul,
.editor-content ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content hr {
  border: none;
  border-top: 2px solid #eee;
  margin: 1.5em 0;
}

.editor-content a {
  color: var(--v-primary-base, #1976d2);
  text-decoration: none;
  border-bottom: 1px solid currentColor;
}

.editor-content a:hover {
  border-bottom: 1px solid transparent;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 4px;
  }

  .toolbar-btn {
    min-width: 32px !important;
    height: 32px !important;
  }

  .editor-content {
    padding: 12px;
  }
}
</style>
