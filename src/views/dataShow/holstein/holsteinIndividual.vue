<template>
  <v-container class="fill-height py-10">
    <!-- 空状态 -->
    <v-row justify="center" align="center" class="w-100">
      <v-col cols="12" md="8" lg="6">
        <v-empty-state
            icon="mdi-file-document-alert-outline"
            title="暂无个体数据"
            text="请选择一个荷斯坦个体或设置筛选条件后，将展示生长曲线、产奶量与健康指标。"
        >
          <template #actions>
            <v-btn variant="text" @click="onRefresh">刷新</v-btn>
          </template>
        </v-empty-state>
      </v-col>
    </v-row>

    <!-- 骨架屏：预览未来布局（图表 + 指标卡 + 表格/列表） -->
    <v-row class="w-100 mt-8" justify="center">
      <v-col cols="12" md="10">
        <v-skeleton-loader type="heading" class="mb-4" />
        <v-skeleton-loader type="image" height="220" class="rounded mb-6" />

        <v-row>
          <v-col cols="12" sm="4" v-for="n in 3" :key="n">
            <v-skeleton-loader type="list-item-two-line" class="rounded" />
          </v-col>
        </v-row>

        <v-skeleton-loader type="table" class="rounded mt-6" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const onSelect = () => {
  // TODO: 跳转或者打开选择器
}
const onRefresh = () => {
  // TODO: 触发重新拉取
}
</script>

<style scoped>
.rounded { border-radius: 12px; }
</style>