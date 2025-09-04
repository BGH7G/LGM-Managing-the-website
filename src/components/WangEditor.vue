<script setup>
import { ref, onBeforeUnmount, watch, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { authApi } from '@/utils/axios'

// 双向绑定 value
const props = defineProps({
  modelValue: { type: String, default: '' },
  toolbarConfig: { type: Object, default: () => ({}) },
  editorConfig: { type: Object, default: () => ({ placeholder: '请输入内容...' }) }
})
const emit = defineEmits(['update:modelValue'])

const html = ref(props.modelValue)
watch(() => props.modelValue, v => (html.value = v))
watch(html, v => emit('update:modelValue', v))

const editorInstance = ref(null)

function handleCreated(editor) {
  editorInstance.value = editor
}

onBeforeUnmount(() => {
  editorInstance.value?.destroy()
})

const mergedEditorConfig = computed(() => {
  const cfg = { placeholder: '请输入内容...', ...props.editorConfig }
  if (!cfg.MENU_CONF) cfg.MENU_CONF = {}
  cfg.MENU_CONF['uploadImage'] = {
    // 其他限制，可按需暴露为 props
    maxFileSize: 1 * 1024 * 1024,
    maxNumberOfFiles: 10,
    allowedFileTypes: ['image/jpeg', 'image/png'],
    customUpload: async (file, insertFn) => {
      const fd = new FormData()
      fd.append('images', file)
      try {
        const { data } = await authApi.post('/upload/image/', fd)
        const url = data.url || data.data?.url || ''
        console.log(url)
        if (url) insertFn(url)
      } catch (e) {
        console.error('图片上传失败', e)
      }
    }
  }
  return cfg
})
</script>

<template>
  <div class="wang-editor">
    <Toolbar
      :editor="editorInstance"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="html"
      :default-config="mergedEditorConfig"
      mode="default"
      @onCreated="handleCreated"
    />
  </div>
</template>

<style scoped>
.wang-editor {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}
</style>