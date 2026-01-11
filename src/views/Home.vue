<template>
  <v-container fluid class="pa-4">
    <v-row>
      <!-- 标签分布图
      <v-col cols="12" md="4">
        <TagDistributionChart />
      </v-col> -->

      <!-- OpenAlex 学术检索 -->
      <v-col cols="12" :md="selectedEntity ? 7 : 12">
        <!-- Works 搜索 -->
        <OpenAlex
          v-if="selectedEndpoint === 'works'"
          ref="worksSearchRef"
          :selected-endpoint="selectedEndpoint"
          @update:selected-endpoint="selectedEndpoint = $event"
          @search-complete="handleSearchComplete"
          @entity-click="handleEntityClick"
        />

        <!-- Authors 搜索 -->
        <OpenAlexAuthors
          v-else-if="selectedEndpoint === 'authors'"
          :selected-endpoint="selectedEndpoint"
          @update:selected-endpoint="selectedEndpoint = $event"
          @entity-click="handleEntityClick"
        />
      </v-col>

      <!-- 实体详情卡片（右侧空白区域） -->
      <v-col v-if="selectedEntity" cols="12" md="5">
        <EntityDetailCard
          :entity-type="selectedEntity.type"
          :entity-id="selectedEntity.id"
          @close="selectedEntity = null"
          @entity-click="handleEntityClick"
          @view-author-works="handleViewAuthorWorks"
        />
      </v-col>

      <!-- 搜索结果数据分析（如果有搜索结果且是 Works） -->
      <v-col v-if="searchResults.length > 0 && selectedEndpoint === 'works'" cols="12">
        <OpenAlexStatistics :works="searchResults" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {ref} from 'vue'
import LocationWithSheep from '@/components/LocationWithSheep.vue'
// import TagDistributionChart from '@/components/TagDistributionChart.vue'
import OpenAlex from '@/components/OpenAlex.vue'
import OpenAlexAuthors from '@/components/OpenAlexAuthors.vue'
import OpenAlexStatistics from '@/components/OpenAlexStatistics.vue'
import EntityDetailCard from '@/components/EntityDetailCard.vue'

const searchResults = ref([])
const selectedEntity = ref(null)
const selectedEndpoint = ref('works')
const worksSearchRef = ref(null)

const handleSearchComplete = (results) => {
  searchResults.value = results || []
}

const handleEntityClick = (entity) => {
  selectedEntity.value = entity
  // 滚动到顶部以查看详情卡片
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleViewAuthorWorks = async (authorId) => {
  try {
    // 切换到 works 端点
    selectedEndpoint.value = 'works'

    // 关闭实体详情卡片,让文章列表完全显示
    selectedEntity.value = null

    // 等待 DOM 更新,确保 OpenAlex 组件已渲染
    await new Promise(resolve => setTimeout(resolve, 100))

    // 调用 OpenAlex 组件的方法来加载作者的文章
    if (worksSearchRef.value && worksSearchRef.value.loadAuthorWorks) {
      await worksSearchRef.value.loadAuthorWorks(authorId)
    }

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('获取作者文章失败:', error)
  }
}
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
