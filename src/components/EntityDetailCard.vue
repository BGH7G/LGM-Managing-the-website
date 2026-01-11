<template>
  <div v-if="entity" class="entity-card-container">
    <div class="entity-card">
      <!-- 头部 -->
      <div class="entity-header">
        <div class="header-content">
          <v-icon :icon="entityIcon" size="28" class="entity-icon" />
          <div class="header-text">
            <div class="entity-type-label">{{ entityTypeLabel }}</div>
            <h3 class="entity-title">{{ entity.display_name }}</h3>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="close-btn"
          @click="$emit('close')"
        />
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="loading-text">加载详细信息...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <v-icon icon="mdi-alert-circle-outline" size="48" color="error" />
        <p class="error-text">{{ error }}</p>
        <v-btn variant="outlined" size="small" @click="loadEntityDetails">
          重试
        </v-btn>
      </div>

      <!-- 内容区域 -->
      <div v-else class="entity-content">
        <!-- 作者详情 -->
        <template v-if="entityType === 'author'">
          <div class="stat-row">
            <div class="stat-item stat-item-clickable" @click="$emit('view-author-works', entityId)">
              <div class="stat-value">{{ entity.works_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">
                发表文章
                <v-icon size="12" class="ml-1">mdi-open-in-new</v-icon>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.cited_by_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">总引用数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.summary_stats.h_index || 0 }}</div>
              <div class="stat-label">H-Index</div>
            </div>
          </div>

          <div v-if="entity.last_known_institutions && entity.last_known_institutions.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-domain" size="16" />
              所属机构
            </div>
            <div class="institution-list">
              <div
                v-for="inst in entity.last_known_institutions"
                :key="inst.id"
                class="institution-item clickable"
                @click="$emit('entity-click', { type: 'institution', id: extractId(inst.id) })"
              >
                <v-icon icon="mdi-domain" size="14" class="mr-1" />
                {{ inst.display_name }}
                <v-chip v-if="inst.country_code" size="x-small" class="ml-2">
                  {{ inst.country_code }}
                </v-chip>
              </div>
            </div>
          </div>

          <div v-if="entity.x_concepts && entity.x_concepts.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-tag-multiple" size="16" />
              研究领域
            </div>
            <div class="concepts-list">
              <v-chip
                v-for="concept in entity.x_concepts.slice(0, 10)"
                :key="concept.id"
                size="small"
                class="concept-chip"
              >
                {{ concept.display_name }}
                <span class="concept-score">{{ Math.round(concept.score * 100) }}%</span>
              </v-chip>
            </div>
          </div>
        </template>

        <!-- 期刊/来源详情 -->
        <template v-else-if="entityType === 'source'">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ entity.works_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">收录文章</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.cited_by_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">总引用数</div>
            </div>
          </div>

          <div v-if="entity.host_organization_name" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-domain" size="16" />
              出版商
            </div>
            <div class="info-value">{{ entity.host_organization_name }}</div>
          </div>

          <div v-if="entity.issn_l || entity.issn" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-identifier" size="16" />
              ISSN
            </div>
            <div class="info-value">{{ entity.issn_l || entity.issn?.[0] }}</div>
          </div>

          <div v-if="entity.homepage_url" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-web" size="16" />
              官方网站
            </div>
            <a :href="entity.homepage_url" target="_blank" class="link-value">
              {{ entity.homepage_url }}
              <v-icon icon="mdi-open-in-new" size="12" />
            </a>
          </div>

          <div v-if="entity.x_concepts && entity.x_concepts.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-tag-multiple" size="16" />
              主要领域
            </div>
            <div class="concepts-list">
              <v-chip
                v-for="concept in entity.x_concepts.slice(0, 10)"
                :key="concept.id"
                size="small"
                class="concept-chip"
              >
                {{ concept.display_name }}
                <span class="concept-score">{{ Math.round(concept.score * 100) }}%</span>
              </v-chip>
            </div>
          </div>
        </template>

        <!-- 机构详情 -->
        <template v-else-if="entityType === 'institution'">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ entity.works_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">发表文章</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.cited_by_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">总引用数</div>
            </div>
          </div>

          <div v-if="entity.country_code" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-map-marker" size="16" />
              国家/地区
            </div>
            <div class="info-value">
              {{ entity.country_code }}
              <span v-if="entity.display_name_international?.en" class="text-caption ml-2">
                ({{ entity.display_name_international.en }})
              </span>
            </div>
          </div>

          <div v-if="entity.type" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-shape" size="16" />
              机构类型
            </div>
            <div class="info-value">{{ formatInstitutionType(entity.type) }}</div>
          </div>

          <div v-if="entity.homepage_url" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-web" size="16" />
              官方网站
            </div>
            <a :href="entity.homepage_url" target="_blank" class="link-value">
              {{ entity.homepage_url }}
              <v-icon icon="mdi-open-in-new" size="12" />
            </a>
          </div>

          <div v-if="entity.x_concepts && entity.x_concepts.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-tag-multiple" size="16" />
              主要研究领域
            </div>
            <div class="concepts-list">
              <v-chip
                v-for="concept in entity.x_concepts.slice(0, 10)"
                :key="concept.id"
                size="small"
                class="concept-chip"
              >
                {{ concept.display_name }}
                <span class="concept-score">{{ Math.round(concept.score * 100) }}%</span>
              </v-chip>
            </div>
          </div>
        </template>

        <!-- 出版商详情 -->
        <template v-else-if="entityType === 'publisher'">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ entity.works_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">出版文章</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.sources_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">旗下期刊</div>
            </div>
          </div>

          <div v-if="entity.country_codes && entity.country_codes.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-map-marker" size="16" />
              国家/地区
            </div>
            <div class="info-value">
              {{ entity.country_codes.join(', ') }}
            </div>
          </div>

          <div v-if="entity.homepage_url" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-web" size="16" />
              官方网站
            </div>
            <a :href="entity.homepage_url" target="_blank" class="link-value">
              {{ entity.homepage_url }}
              <v-icon icon="mdi-open-in-new" size="12" />
            </a>
          </div>
        </template>

        <!-- 文章详情 -->
        <template v-else-if="entityType === 'work'">
          <div class="stat-row">
            <div class="stat-item">
              <div class="stat-value">{{ entity.publication_year || 'N/A' }}</div>
              <div class="stat-label">发表年份</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ entity.cited_by_count?.toLocaleString() || 0 }}</div>
              <div class="stat-label">引用数</div>
            </div>
            <div v-if="entity.open_access" class="stat-item">
              <div class="stat-value">
                <v-icon
                  :icon="entity.open_access.is_oa ? 'mdi-lock-open-variant' : 'mdi-lock'"
                  :color="entity.open_access.is_oa ? 'success' : 'grey'"
                  size="32"
                />
              </div>
              <div class="stat-label">{{ entity.open_access.is_oa ? '开放获取' : '非开放' }}</div>
            </div>
          </div>

          <div v-if="entity.doi" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-identifier" size="16" />
              DOI
            </div>
            <a :href="`https://doi.org/${entity.doi}`" target="_blank" class="link-value">
              {{ entity.doi }}
              <v-icon icon="mdi-open-in-new" size="12" />
            </a>
          </div>

          <div v-if="entity.type" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-file-document" size="16" />
              文章类型
            </div>
            <div class="info-value">{{ formatWorkType(entity.type) }}</div>
          </div>

          <div v-if="entity.authorships && entity.authorships.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-account-multiple" size="16" />
              作者列表
            </div>
            <div class="authors-list">
              <div
                v-for="(authorship, idx) in entity.authorships.slice(0, 10)"
                :key="authorship.author?.id || idx"
                class="author-item clickable"
                @click="authorship.author?.id && $emit('entity-click', { type: 'author', id: extractId(authorship.author.id) })"
              >
                <v-icon icon="mdi-account" size="14" class="mr-1" />
                {{ authorship.author?.display_name || '未知' }}
                <v-chip v-if="authorship.institutions && authorship.institutions[0]" size="x-small" class="ml-2">
                  {{ authorship.institutions[0].display_name }}
                </v-chip>
              </div>
              <div v-if="entity.authorships.length > 10" class="text-caption text-grey mt-2">
                ... 共 {{ entity.authorships.length }} 位作者
              </div>
            </div>
          </div>

          <div v-if="entity.primary_location?.source" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-book-open-page-variant" size="16" />
              发表期刊
            </div>
            <div
              class="info-value clickable"
              @click="entity.primary_location.source.id && $emit('entity-click', { type: 'source', id: extractId(entity.primary_location.source.id) })"
            >
              {{ entity.primary_location.source.display_name }}
            </div>
          </div>

          <div v-if="entity.abstract_inverted_index" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-text" size="16" />
              摘要
            </div>
            <div class="abstract-text">
              {{ formatAbstract(entity.abstract_inverted_index) }}
            </div>
          </div>

          <div v-if="entity.topics && entity.topics.length > 0" class="info-section">
            <div class="section-title">
              <v-icon icon="mdi-tag-multiple" size="16" />
              主题标签
            </div>
            <div class="concepts-list">
              <v-chip
                v-for="topic in entity.topics.slice(0, 10)"
                :key="topic.id"
                size="small"
                class="concept-chip"
              >
                {{ topic.display_name }}
                <span v-if="topic.score" class="concept-score">{{ Math.round(topic.score * 100) }}%</span>
              </v-chip>
            </div>
          </div>
        </template>

        <!-- 底部链接 -->
        <div class="entity-footer">
          <v-btn
            v-if="entity.ids?.openalex"
            :href="entity.ids.openalex"
            target="_blank"
            variant="outlined"
            size="small"
            prepend-icon="mdi-open-in-new"
          >
            在 OpenAlex 中查看
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAuthorById, getSourceById, getInstitutionById, getPublisherById, getWorkById } from '@/api/openalex.api'

const props = defineProps({
  entityType: {
    type: String,
    required: true,
    validator: (value) => ['author', 'source', 'institution', 'publisher', 'work'].includes(value)
  },
  entityId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'entity-click', 'view-author-works'])

const entity = ref(null)
const loading = ref(false)
const error = ref(null)

const entityIcon = computed(() => {
  const icons = {
    author: 'mdi-account-circle',
    source: 'mdi-book-open-page-variant',
    institution: 'mdi-domain',
    publisher: 'mdi-office-building',
    work: 'mdi-file-document'
  }
  return icons[props.entityType]
})

const entityTypeLabel = computed(() => {
  const labels = {
    author: '作者',
    source: '期刊/来源',
    institution: '机构',
    publisher: '出版商',
    work: '文章'
  }
  return labels[props.entityType]
})

const loadEntityDetails = async () => {
  loading.value = true
  error.value = null

  try {
    let response
    switch (props.entityType) {
      case 'author':
        response = await getAuthorById(props.entityId)
        break
      case 'source':
        response = await getSourceById(props.entityId)
        break
      case 'institution':
        response = await getInstitutionById(props.entityId)
        break
      case 'publisher':
        response = await getPublisherById(props.entityId)
        break
      case 'work':
        response = await getWorkById(props.entityId)
        break
      default:
        throw new Error('不支持的实体类型')
    }

    entity.value = response.data
  } catch (err) {
    console.error('加载实体详情失败:', err)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const extractId = (url) => {
  // 从 OpenAlex URL 中提取 ID
  // 例如：https://openalex.org/I114027177 -> I114027177
  return url.split('/').pop()
}

const formatInstitutionType = (type) => {
  const typeMap = {
    education: '教育机构',
    healthcare: '医疗机构',
    company: '公司',
    archive: '档案馆',
    nonprofit: '非营利组织',
    government: '政府机构',
    facility: '研究设施',
    other: '其他'
  }
  return typeMap[type] || type
}

const formatWorkType = (type) => {
  const typeMap = {
    'article': '期刊文章',
    'book-chapter': '书籍章节',
    'proceedings-article': '会议论文',
    'dissertation': '学位论文',
    'preprint': '预印本',
    'paratext': '辅助文本',
    'other': '其他'
  }
  return typeMap[type] || type
}

const formatAbstract = (invertedIndex) => {
  if (!invertedIndex) return ''

  // 将倒排索引转换为正常文本
  const words = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach(pos => {
      words[pos] = word
    })
  }

  const fullText = words.join(' ')
  return fullText
}

// 监听 props 变化，重新加载数据
watch(
  () => [props.entityType, props.entityId],
  () => {
    loadEntityDetails()
  },
  { immediate: true }
)
</script>

<style scoped>
.entity-card-container {
  position: sticky;
  top: 16px;
  height: fit-content;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
}

.entity-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.entity-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(0, 122, 255, 0.02) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.entity-icon {
  color: rgba(0, 122, 255, 0.8);
  flex-shrink: 0;
  margin-top: 4px;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.entity-type-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 122, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.entity-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  line-height: 1.3;
  margin: 0;
  word-break: break-word;
}

.close-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  opacity: 1;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 16px;
}

.loading-text,
.error-text {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.entity-content {
  padding: 24px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(0, 122, 255, 0.02) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 122, 255, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-item-clickable {
  cursor: pointer;
  position: relative;
}

.stat-item-clickable:hover {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0.08) 100%);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
}

.stat-item-clickable::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 122, 255, 0.6) 0%, rgba(0, 122, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-item-clickable:hover::before {
  opacity: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 122, 255, 0.9);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.info-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
}

.link-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: rgba(0, 122, 255, 0.9);
  text-decoration: none;
  transition: color 0.2s ease;
  word-break: break-all;
}

.link-value:hover {
  color: rgba(0, 122, 255, 1);
  text-decoration: underline;
}

.institution-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.institution-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  transition: all 0.2s ease;
}

.institution-item.clickable {
  cursor: pointer;
}

.institution-item.clickable:hover {
  background: rgba(0, 122, 255, 0.08);
  color: rgba(0, 122, 255, 0.9);
}

.concepts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.concept-chip {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 122, 255, 0.05) 100%);
  border: 1px solid rgba(0, 122, 255, 0.15);
}

.concept-score {
  margin-left: 6px;
  font-size: 11px;
  opacity: 0.7;
}

.authors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.author-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  transition: all 0.2s ease;
}

.author-item.clickable {
  cursor: pointer;
}

.author-item.clickable:hover {
  background: rgba(0, 122, 255, 0.08);
  color: rgba(0, 122, 255, 0.9);
}

.abstract-text {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.75);
  text-align: justify;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.abstract-text::-webkit-scrollbar {
  width: 4px;
}

.abstract-text::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.abstract-text::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.abstract-text::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.info-value.clickable {
  color: rgba(0, 122, 255, 0.9);
}

.info-value.clickable:hover {
  color: rgba(0, 122, 255, 1);
  text-decoration: underline;
}

.entity-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

/* 自定义滚动条 */
.entity-card-container::-webkit-scrollbar {
  width: 6px;
}

.entity-card-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.entity-card-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.entity-card-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
