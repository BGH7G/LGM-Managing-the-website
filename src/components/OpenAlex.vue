<template>
  <v-card class="glass-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-book-search</v-icon>
      <span class="text-h5 font-weight-bold">Works Search</span>
      <v-spacer></v-spacer>
      <v-chip variant="outlined" size="small">
        OpenAlex database
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 搜索栏和筛选工具栏 -->
      <div class="search-toolbar mb-4">
        <v-text-field
          v-model="searchQuery"
          label="Search works"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          @keyup.enter="handleSearch"
        >
          <template #prepend-inner>
            <!-- 端点选择器 -->
            <v-menu offset-y max-width="320">
              <template #activator="{ props }">
                <v-btn
                  variant="text"
                  v-bind="props"
                  class="endpoint-selector-btn"
                >
                  <v-icon :icon="currentEndpoint.icon" class="mr-2" size="20"></v-icon>
                  <span class="endpoint-selector-text">{{ currentEndpoint.title }}</span>
                  <v-icon icon="mdi-chevron-down" size="20" class="ml-1"></v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="endpoint-menu">
                <v-list-item
                  v-for="option in endpointOptions"
                  :key="option.value"
                  :active="option.value === selectedEndpoint"
                  :disabled="option.disabled"
                  @click="!option.disabled && switchEndpoint(option.value)"
                >
                  <template #prepend>
                    <v-icon :icon="option.icon" size="20"></v-icon>
                  </template>
                  <v-list-item-title>{{ option.title }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ option.description }}</v-list-item-subtitle>
                  <template #append>
                    <v-icon v-if="option.value === selectedEndpoint" icon="mdi-check" size="20"></v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-divider vertical class="mx-2"></v-divider>
            <v-icon icon="mdi-magnify" class="mr-2"></v-icon>
          </template>
          <template #append-inner>
            <!-- 排序菜单 -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  v-bind="props"
                  class="toolbar-icon"
                >
                  <v-badge
                    v-if="sortBy !== 'relevance_score' || sortOrder !== 'desc'"
                    color="primary"
                    dot
                  >
                    <v-icon>mdi-sort</v-icon>
                  </v-badge>
                  <v-icon v-else>mdi-sort</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="filter-menu">
                <v-list-subheader>Sort by</v-list-subheader>
                <v-list-item
                  v-for="option in sortOptions"
                  :key="option.value"
                  :active="sortBy === option.value"
                  @click="sortBy = option.value; handleSearch()"
                >
                  <v-list-item-title>{{ option.title }}</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortBy === option.value">mdi-check</v-icon>
                  </template>
                </v-list-item>
                <v-divider class="my-1"></v-divider>
                <v-list-item
                  :active="sortOrder === 'desc'"
                  @click="sortOrder = 'desc'; handleSearch()"
                >
                  <v-list-item-title>降序</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortOrder === 'desc'">mdi-check</v-icon>
                  </template>
                </v-list-item>
                <v-list-item
                  :active="sortOrder === 'asc'"
                  @click="sortOrder = 'asc'; handleSearch()"
                >
                  <v-list-item-title>升序</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortOrder === 'asc'">mdi-check</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- 筛选菜单 -->
            <v-menu offset-y max-width="400">
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  v-bind="props"
                  class="toolbar-icon"
                >
                  <v-badge
                    v-if="hasActiveFilters"
                    :content="activeFiltersCount"
                    color="primary"
                  >
                    <v-icon>mdi-filter-variant</v-icon>
                  </v-badge>
                  <v-icon v-else>mdi-filter-variant</v-icon>
                </v-btn>
              </template>
              <v-card class="filter-menu">
                <v-card-title class="text-subtitle-1 pa-3 pb-2">
                  Filters
                  <v-btn
                    v-if="hasActiveFilters"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="clearFilters"
                  >
                    Clear all
                  </v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-3">
                  <!-- 年份范围 -->
                  <div class="filter-section">
                    <div class="filter-label">Publication year</div>
                    <div class="d-flex gap-2">
                      <v-text-field
                        v-model.number="filters.fromYear"
                        label="From"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-text-field>
                      <v-text-field
                        v-model.number="filters.toYear"
                        label="To"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </div>
                  </div>

                  <!-- 引用数范围 -->
                  <div class="filter-section">
                    <div class="filter-label">Citation count</div>
                    <div class="d-flex gap-2">
                      <v-text-field
                        v-model.number="filters.minCitations"
                        label="Min"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-text-field>
                      <v-text-field
                        v-model.number="filters.maxCitations"
                        label="Max"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </div>
                  </div>

                  <!-- 开放获取状态 -->
                  <div class="filter-section">
                    <div class="filter-label">Open Access</div>
                    <v-select
                      v-model="filters.openAccess"
                      :items="openAccessOptions"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </div>

                  <!-- 文章类型 -->
                  <div class="filter-section">
                    <div class="filter-label">Type</div>
                    <v-select
                      v-model="filters.type"
                      :items="typeOptions"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </div>

                  <!-- 应用按钮 -->
                  <v-btn
                    color="primary"
                    block
                    class="mt-3"
                    :loading="loading"
                    @click="handleSearch"
                  >
                    Apply filters
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-menu>

            <!-- 搜索按钮 -->
            <v-btn
              color="primary"
              :loading="loading"
              class="ml-2"
              @click="handleSearch"
            >
              Search
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- 从搜索结果提取的二次筛选器 -->
      <div v-if="searchResults && searchResults.length > 0" class="facets-container mb-4">
        <!-- 第一行：Topic, Institution, Type -->
        <v-row class="mb-3">
          <!-- Topic 筛选 -->
          <v-col cols="12" md="4">
            <div class="facet-card">
              <div class="facet-header" @click="topicExpanded = !topicExpanded">
                <v-icon size="20" class="mr-2">mdi-tag-multiple</v-icon>
                <span class="facet-title">Topic</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': topicExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="topicExpanded" class="facet-content">
                <div
                  v-for="topic in topTopics"
                  :key="topic.name"
                  class="facet-item"
                  :class="{ 'active': selectedTopics.includes(topic.name) }"
                  @click="toggleTopic(topic.name)"
                >
                  <v-checkbox
                    :model-value="selectedTopics.includes(topic.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ topic.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ topic.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedTopics.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllTopics = !showAllTopics"
                >
                  {{ showAllTopics ? '收起' : `更多 (${extractedTopics.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Institution 筛选 -->
          <v-col cols="12" md="4">
            <div class="facet-card">
              <div class="facet-header" @click="institutionExpanded = !institutionExpanded">
                <v-icon size="20" class="mr-2">mdi-domain</v-icon>
                <span class="facet-title">Institution</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': institutionExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="institutionExpanded" class="facet-content">
                <div
                  v-for="institution in topInstitutions"
                  :key="institution.name"
                  class="facet-item"
                  :class="{ 'active': selectedInstitutions.includes(institution.name) }"
                  @click="toggleInstitution(institution.name)"
                >
                  <v-checkbox
                    :model-value="selectedInstitutions.includes(institution.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ institution.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ institution.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedInstitutions.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllInstitutions = !showAllInstitutions"
                >
                  {{ showAllInstitutions ? '收起' : `更多 (${extractedInstitutions.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Type 筛选 -->
          <v-col cols="12" md="4">
            <div class="facet-card">
              <div class="facet-header" @click="typeExpanded = !typeExpanded">
                <v-icon size="20" class="mr-2">mdi-file-document</v-icon>
                <span class="facet-title">Type</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': typeExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="typeExpanded" class="facet-content">
                <div
                  v-for="type in extractedTypes"
                  :key="type.name"
                  class="facet-item"
                  :class="{ 'active': selectedTypes.includes(type.name) }"
                  @click="toggleType(type.name)"
                >
                  <v-checkbox
                    :model-value="selectedTypes.includes(type.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ formatType(type.name) }}</span>
                  <v-chip size="x-small" class="facet-count">{{ type.count }}</v-chip>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- 第二行：Source, Publisher, Country, Author -->
        <v-row>
          <!-- Source 筛选 -->
          <v-col cols="12" md="3">
            <div class="facet-card">
              <div class="facet-header" @click="sourceExpanded = !sourceExpanded">
                <v-icon size="20" class="mr-2">mdi-book-open-variant</v-icon>
                <span class="facet-title">Source</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': sourceExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="sourceExpanded" class="facet-content">
                <div
                  v-for="source in topSources"
                  :key="source.name"
                  class="facet-item"
                  :class="{ 'active': selectedSources.includes(source.name) }"
                  @click="toggleSource(source.name)"
                >
                  <v-checkbox
                    :model-value="selectedSources.includes(source.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ source.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ source.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedSources.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllSources = !showAllSources"
                >
                  {{ showAllSources ? '收起' : `更多 (${extractedSources.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Publisher 筛选 -->
          <v-col cols="12" md="3">
            <div class="facet-card">
              <div class="facet-header" @click="publisherExpanded = !publisherExpanded">
                <v-icon size="20" class="mr-2">mdi-office-building</v-icon>
                <span class="facet-title">Publisher</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': publisherExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="publisherExpanded" class="facet-content">
                <div
                  v-for="publisher in topPublishers"
                  :key="publisher.name"
                  class="facet-item"
                  :class="{ 'active': selectedPublishers.includes(publisher.name) }"
                  @click="togglePublisher(publisher.name)"
                >
                  <v-checkbox
                    :model-value="selectedPublishers.includes(publisher.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ publisher.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ publisher.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedPublishers.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllPublishers = !showAllPublishers"
                >
                  {{ showAllPublishers ? '收起' : `更多 (${extractedPublishers.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Country 筛选 -->
          <v-col cols="12" md="3">
            <div class="facet-card">
              <div class="facet-header" @click="countryExpanded = !countryExpanded">
                <v-icon size="20" class="mr-2">mdi-earth</v-icon>
                <span class="facet-title">Country</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': countryExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="countryExpanded" class="facet-content">
                <div
                  v-for="country in topCountries"
                  :key="country.name"
                  class="facet-item"
                  :class="{ 'active': selectedCountries.includes(country.name) }"
                  @click="toggleCountry(country.name)"
                >
                  <v-checkbox
                    :model-value="selectedCountries.includes(country.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ country.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ country.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedCountries.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllCountries = !showAllCountries"
                >
                  {{ showAllCountries ? '收起' : `更多 (${extractedCountries.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <!-- Author 筛选 -->
          <v-col cols="12" md="3">
            <div class="facet-card">
              <div class="facet-header" @click="authorExpanded = !authorExpanded">
                <v-icon size="20" class="mr-2">mdi-account-multiple</v-icon>
                <span class="facet-title">Author</span>
                <v-icon
                  size="16"
                  class="ml-auto toggle-icon"
                  :class="{ 'rotate': authorExpanded }"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
              <div v-show="authorExpanded" class="facet-content">
                <div
                  v-for="author in topAuthors"
                  :key="author.name"
                  class="facet-item"
                  :class="{ 'active': selectedAuthors.includes(author.name) }"
                  @click="toggleAuthor(author.name)"
                >
                  <v-checkbox
                    :model-value="selectedAuthors.includes(author.name)"
                    hide-details
                    density="compact"
                    class="facet-checkbox"
                  ></v-checkbox>
                  <span class="facet-label">{{ author.name }}</span>
                  <v-chip size="x-small" class="facet-count">{{ author.count }}</v-chip>
                </div>
                <v-btn
                  v-if="extractedAuthors.length > 5"
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click.stop="showAllAuthors = !showAllAuthors"
                >
                  {{ showAllAuthors ? '收起' : `更多 (${extractedAuthors.length - 5})` }}
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- 搜索结果统计 -->
      <div v-if="searchResults" class="mb-4">
        <v-alert
          variant="tonal"
          color="primary"
          density="compact"
          icon="mdi-information"
        >
          找到 {{ totalResults?.toLocaleString() || 0 }} 篇文章
          <span v-if="searchQuery">
            (关键词: "{{ searchQuery }}")
          </span>
        </v-alert>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="text-body-2 text-brand-muted mt-4">Searching...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!searchResults && !error"
        class="text-center py-12"
      >
      </div>

      <!-- 错误状态 -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchResults && searchResults.length > 0">
        <!-- 顶部分页器 -->
        <div class="d-flex justify-center mb-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>

        <v-card
          v-for="work in searchResults"
          :key="work.id"
          class="mb-3"
          variant="outlined"
        >
          <v-card-text>
            <!-- 标题 -->
            <h3 class="text-h6 mb-2">
              <span
                class="work-title-link"
                @click="handleEntityClick('work', extractId(work.id))"
              >
                {{ work.title }}
              </span>
              <a
                v-if="work.doi"
                :href="`https://doi.org/${work.doi}`"
                target="_blank"
                class="doi-link"
                @click.stop
              >
                <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
              </a>
            </h3>

            <!-- 作者信息 -->
            <div class="text-body-2 text-brand-muted mb-2">
              <v-icon size="small" class="mr-1">mdi-account-multiple</v-icon>
              <template v-if="work.authorships && work.authorships.length > 0">
                <span
                  v-for="(authorship, idx) in work.authorships.slice(0, 5)"
                  :key="authorship.author?.id || idx"
                >
                  <span
                    v-if="authorship.author?.id"
                    class="author-link"
                    @click="handleEntityClick('author', extractId(authorship.author.id))"
                  >
                    {{ authorship.author.display_name }}
                  </span>
                  <span v-else>{{ authorship.author?.display_name || '未知' }}</span>
                  <span v-if="idx < Math.min(work.authorships.length, 5) - 1">, </span>
                </span>
                <span v-if="work.authorships.length > 5"> 等 {{ work.authorships.length }} 位作者</span>
              </template>
              <span v-else>无作者信息</span>
            </div>

            <!-- 元数据 -->
            <div class="d-flex flex-wrap gap-2 mb-3">
              <!-- 年份 -->
              <v-chip
                v-if="work.publication_year"
                size="small"
                variant="outlined"
                prepend-icon="mdi-calendar"
              >
                {{ work.publication_year }}
              </v-chip>

              <!-- 引用数 -->
              <v-chip
                size="small"
                variant="outlined"
                prepend-icon="mdi-format-quote-close"
                color="primary"
              >
                引用: {{ work.cited_by_count }}
              </v-chip>

              <!-- 开放获取 -->
              <v-chip
                v-if="work.open_access?.is_oa"
                size="small"
                variant="flat"
                color="success"
                prepend-icon="mdi-lock-open-variant"
              >
                开放获取
              </v-chip>

              <!-- 文章类型 -->
              <v-chip
                v-if="work.type"
                size="small"
                variant="outlined"
              >
                {{ formatType(work.type) }}
              </v-chip>
            </div>

            <!-- 摘要（如果有） -->
            <p
              v-if="work.abstract_inverted_index"
              class="text-body-2 mb-2"
            >
              {{ formatAbstract(work.abstract_inverted_index) }}
            </p>

            <!-- 来源信息 -->
            <div
              v-if="work.primary_location?.source"
              class="text-caption text-brand-muted"
            >
              <v-icon size="small" class="mr-1">mdi-book-open-variant</v-icon>
              <span
                v-if="work.primary_location.source.id"
                class="source-link"
                @click="handleEntityClick('source', extractId(work.primary_location.source.id))"
              >
                {{ work.primary_location.source.display_name }}
              </span>
              <span v-else>{{ work.primary_location.source.display_name }}</span>
            </div>
          </v-card-text>
        </v-card>

        <!-- 分页器 -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>
      </div>

      <!-- 无结果状态 -->
      <div
        v-else-if="searchResults && searchResults.length === 0"
        class="text-center py-12"
      >
        <v-icon size="64" color="grey-lighten-1">mdi-text-box-search-outline</v-icon>
        <p class="text-h6 text-brand-muted mt-4">未找到相关文章</p>
        <p class="text-body-2 text-brand-muted">请尝试其他关键词或调整筛选条件</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import {searchWorks} from '@/api/openalex.api'

// 定义组件 props
const props = defineProps({
  selectedEndpoint: {
    type: String,
    default: 'works'
  }
})

// 定义组件 emit
const emit = defineEmits(['search-complete', 'entity-click', 'update:selected-endpoint'])

// 端点选项
const endpointOptions = [
  {
    title: 'Works',
    value: 'works',
    icon: 'mdi-file-document-multiple',
    description: 'Scholarly papers, books, datasets, etc.'
  },
  {
    title: 'Authors',
    value: 'authors',
    icon: 'mdi-account-multiple',
    description: 'Creators of scholarly works'
  },
  {
    title: 'Sources',
    value: 'sources',
    icon: 'mdi-book-open-page-variant',
    description: 'Journals, conferences, and repositories',
    disabled: true
  },
  {
    title: 'Funders',
    value: 'funders',
    icon: 'mdi-cash-multiple',
    description: 'Organization that funds research',
    disabled: true
  },
  {
    title: 'Institutions',
    value: 'institutions',
    icon: 'mdi-domain',
    description: 'Universities and research centers',
    disabled: true
  }
]

// 获取当前选中的端点信息
const currentEndpoint = computed(() => {
  return endpointOptions.find(opt => opt.value === props.selectedEndpoint) || endpointOptions[0]
})

// 切换端点
const switchEndpoint = (value) => {
  emit('update:selected-endpoint', value)
}

// 搜索相关状态
const searchQuery = ref('')
const searchResults = ref(null)
const allSearchResults = ref([]) // 保存未筛选的完整结果
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalResults = ref(0)
const perPage = ref(25)
const isAuthorWorksMode = ref(false) // 标记是否为查看作者文章模式

// 筛选条件
const filters = ref({
  fromYear: null,
  toYear: null,
  openAccess: '',
  minCitations: null,
  maxCitations: null,
  type: ''
})

// 排序
const sortBy = ref('relevance_score')
const sortOrder = ref('desc')

// 二次筛选相关状态
const selectedTopics = ref([])
const selectedInstitutions = ref([])
const selectedTypes = ref([])
const selectedSources = ref([])
const selectedPublishers = ref([])
const selectedCountries = ref([])
const selectedAuthors = ref([])

const showAllTopics = ref(false)
const showAllInstitutions = ref(false)
const showAllSources = ref(false)
const showAllPublishers = ref(false)
const showAllCountries = ref(false)
const showAllAuthors = ref(false)

const topicExpanded = ref(false)
const institutionExpanded = ref(false)
const typeExpanded = ref(false)
const sourceExpanded = ref(false)
const publisherExpanded = ref(false)
const countryExpanded = ref(false)
const authorExpanded = ref(false)

// 筛选选项
const openAccessOptions = [
  {title: '开放获取', value: 'true'},
  {title: '非开放获取', value: 'false'}
]

const typeOptions = [
  {title: '期刊文章', value: 'article'},
  {title: '书籍章节', value: 'book-chapter'},
  {title: '会议论文', value: 'proceedings-article'},
  {title: '学位论文', value: 'dissertation'},
  {title: '预印本', value: 'preprint'}
]

const sortOptions = [
  {title: '相关性', value: 'relevance_score'},
  {title: '引用数', value: 'cited_by_count'},
  {title: '发表日期', value: 'publication_date'}
]

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(totalResults.value / perPage.value)
})

const hasActiveFilters = computed(() => {
  return !!(
    filters.value.fromYear ||
    filters.value.toYear ||
    filters.value.openAccess ||
    filters.value.minCitations ||
    filters.value.maxCitations ||
    filters.value.type
  )
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.fromYear) count++
  if (filters.value.toYear) count++
  if (filters.value.openAccess) count++
  if (filters.value.minCitations) count++
  if (filters.value.maxCitations) count++
  if (filters.value.type) count++
  return count
})

// 从搜索结果中提取 Topics
const extractedTopics = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const topicMap = new Map()

  allSearchResults.value.forEach(work => {
    if (work.topics && Array.isArray(work.topics)) {
      work.topics.forEach(topic => {
        const name = topic.display_name || topic.name
        if (name) {
          topicMap.set(name, (topicMap.get(name) || 0) + 1)
        }
      })
    }
  })

  return Array.from(topicMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 前5个最常见的 Topics
const topTopics = computed(() => {
  return showAllTopics.value ? extractedTopics.value : extractedTopics.value.slice(0, 5)
})

// 从搜索结果中提取 Institutions
const extractedInstitutions = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const institutionMap = new Map()

  allSearchResults.value.forEach(work => {
    if (work.authorships && Array.isArray(work.authorships)) {
      work.authorships.forEach(authorship => {
        if (authorship.institutions && Array.isArray(authorship.institutions)) {
          authorship.institutions.forEach(institution => {
            const name = institution.display_name
            if (name) {
              institutionMap.set(name, (institutionMap.get(name) || 0) + 1)
            }
          })
        }
      })
    }
  })

  return Array.from(institutionMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 前5个最常见的 Institutions
const topInstitutions = computed(() => {
  return showAllInstitutions.value ? extractedInstitutions.value : extractedInstitutions.value.slice(0, 5)
})

// 从搜索结果中提取 Types
const extractedTypes = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const typeMap = new Map()

  allSearchResults.value.forEach(work => {
    if (work.type) {
      typeMap.set(work.type, (typeMap.get(work.type) || 0) + 1)
    }
  })

  return Array.from(typeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

// 从搜索结果中提取 Sources (期刊/会议名称)
const extractedSources = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const sourceMap = new Map()

  allSearchResults.value.forEach(work => {
    const sourceName = work.primary_location?.source?.display_name ||
                       work.host_venue?.display_name
    if (sourceName) {
      sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1)
    }
  })

  return Array.from(sourceMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const topSources = computed(() => {
  return showAllSources.value ? extractedSources.value : extractedSources.value.slice(0, 5)
})

// 从搜索结果中提取 Publishers (出版商)
const extractedPublishers = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const publisherMap = new Map()

  allSearchResults.value.forEach(work => {
    const publisherName = work.primary_location?.source?.host_organization_name ||
                         work.host_venue?.publisher
    if (publisherName) {
      publisherMap.set(publisherName, (publisherMap.get(publisherName) || 0) + 1)
    }
  })

  return Array.from(publisherMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const topPublishers = computed(() => {
  return showAllPublishers.value ? extractedPublishers.value : extractedPublishers.value.slice(0, 5)
})

// 从搜索结果中提取 Countries (国家)
const extractedCountries = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const countryMap = new Map()

  allSearchResults.value.forEach(work => {
    if (work.authorships && Array.isArray(work.authorships)) {
      work.authorships.forEach(authorship => {
        if (authorship.institutions && Array.isArray(authorship.institutions)) {
          authorship.institutions.forEach(institution => {
            const country = institution.country_code || institution.country
            if (country) {
              countryMap.set(country, (countryMap.get(country) || 0) + 1)
            }
          })
        }
      })
    }
  })

  return Array.from(countryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const topCountries = computed(() => {
  return showAllCountries.value ? extractedCountries.value : extractedCountries.value.slice(0, 5)
})

// 从搜索结果中提取 Authors (作者)
const extractedAuthors = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  const authorMap = new Map()

  allSearchResults.value.forEach(work => {
    if (work.authorships && Array.isArray(work.authorships)) {
      work.authorships.forEach(authorship => {
        const authorName = authorship.author?.display_name
        if (authorName) {
          authorMap.set(authorName, (authorMap.get(authorName) || 0) + 1)
        }
      })
    }
  })

  return Array.from(authorMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const topAuthors = computed(() => {
  return showAllAuthors.value ? extractedAuthors.value : extractedAuthors.value.slice(0, 5)
})

// 根据二次筛选过滤结果
const filteredResults = computed(() => {
  if (!allSearchResults.value || allSearchResults.value.length === 0) return []

  let results = [...allSearchResults.value]

  // 按 Topic 筛选
  if (selectedTopics.value.length > 0) {
    results = results.filter(work => {
      if (!work.topics || !Array.isArray(work.topics)) return false
      return work.topics.some(topic =>
        selectedTopics.value.includes(topic.display_name || topic.name)
      )
    })
  }

  // 按 Institution 筛选
  if (selectedInstitutions.value.length > 0) {
    results = results.filter(work => {
      if (!work.authorships || !Array.isArray(work.authorships)) return false
      return work.authorships.some(authorship => {
        if (!authorship.institutions || !Array.isArray(authorship.institutions)) return false
        return authorship.institutions.some(institution =>
          selectedInstitutions.value.includes(institution.display_name)
        )
      })
    })
  }

  // 按 Type 筛选
  if (selectedTypes.value.length > 0) {
    results = results.filter(work => selectedTypes.value.includes(work.type))
  }

  // 按 Source 筛选
  if (selectedSources.value.length > 0) {
    results = results.filter(work => {
      const sourceName = work.primary_location?.source?.display_name ||
                         work.host_venue?.display_name
      return sourceName && selectedSources.value.includes(sourceName)
    })
  }

  // 按 Publisher 筛选
  if (selectedPublishers.value.length > 0) {
    results = results.filter(work => {
      const publisherName = work.primary_location?.source?.host_organization_name ||
                           work.host_venue?.publisher
      return publisherName && selectedPublishers.value.includes(publisherName)
    })
  }

  // 按 Country 筛选
  if (selectedCountries.value.length > 0) {
    results = results.filter(work => {
      if (!work.authorships || !Array.isArray(work.authorships)) return false
      return work.authorships.some(authorship => {
        if (!authorship.institutions || !Array.isArray(authorship.institutions)) return false
        return authorship.institutions.some(institution => {
          const country = institution.country_code || institution.country
          return country && selectedCountries.value.includes(country)
        })
      })
    })
  }

  // 按 Author 筛选
  if (selectedAuthors.value.length > 0) {
    results = results.filter(work => {
      if (!work.authorships || !Array.isArray(work.authorships)) return false
      return work.authorships.some(authorship =>
        selectedAuthors.value.includes(authorship.author?.display_name)
      )
    })
  }

  return results
})

// 切换 Topic 选择
const toggleTopic = (topicName) => {
  const index = selectedTopics.value.indexOf(topicName)
  if (index > -1) {
    selectedTopics.value.splice(index, 1)
  } else {
    selectedTopics.value.push(topicName)
  }
}

// 切换 Institution 选择
const toggleInstitution = (institutionName) => {
  const index = selectedInstitutions.value.indexOf(institutionName)
  if (index > -1) {
    selectedInstitutions.value.splice(index, 1)
  } else {
    selectedInstitutions.value.push(institutionName)
  }
}

// 切换 Type 选择
const toggleType = (typeName) => {
  const index = selectedTypes.value.indexOf(typeName)
  if (index > -1) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(typeName)
  }
}

// 切换 Source 选择
const toggleSource = (sourceName) => {
  const index = selectedSources.value.indexOf(sourceName)
  if (index > -1) {
    selectedSources.value.splice(index, 1)
  } else {
    selectedSources.value.push(sourceName)
  }
}

// 切换 Publisher 选择
const togglePublisher = (publisherName) => {
  const index = selectedPublishers.value.indexOf(publisherName)
  if (index > -1) {
    selectedPublishers.value.splice(index, 1)
  } else {
    selectedPublishers.value.push(publisherName)
  }
}

// 切换 Country 选择
const toggleCountry = (countryName) => {
  const index = selectedCountries.value.indexOf(countryName)
  if (index > -1) {
    selectedCountries.value.splice(index, 1)
  } else {
    selectedCountries.value.push(countryName)
  }
}

// 切换 Author 选择
const toggleAuthor = (authorName) => {
  const index = selectedAuthors.value.indexOf(authorName)
  if (index > -1) {
    selectedAuthors.value.splice(index, 1)
  } else {
    selectedAuthors.value.push(authorName)
  }
}

// 监听二次筛选变化，更新显示结果
watch(
  () => [
    selectedTopics.value,
    selectedInstitutions.value,
    selectedTypes.value,
    selectedSources.value,
    selectedPublishers.value,
    selectedCountries.value,
    selectedAuthors.value
  ],
  () => {
    searchResults.value = filteredResults.value
    emit('search-complete', searchResults.value)
  },
  { deep: true }
)

// 搜索方法
const handleSearch = async () => {
  if (!searchQuery.value && !hasActiveFilters.value) {
    error.value = '请输入搜索关键词或设置筛选条件'
    return
  }

  currentPage.value = 1
  await fetchWorks()
}

const fetchWorks = async () => {
  loading.value = true
  error.value = null

  try {
    const params = {
      search: searchQuery.value,
      page: currentPage.value,
      perPage: perPage.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...filters.value
    }

    const response = await searchWorks(params)
    allSearchResults.value = response.data.results
    searchResults.value = response.data.results
    totalResults.value = response.data.meta.count

    // 重置所有二次筛选
    selectedTopics.value = []
    selectedInstitutions.value = []
    selectedTypes.value = []
    selectedSources.value = []
    selectedPublishers.value = []
    selectedCountries.value = []
    selectedAuthors.value = []

    // 发射搜索完成事件，将结果传递给父组件
    emit('search-complete', searchResults.value)
  } catch (err) {
    console.error('搜索失败:', err)
    error.value = '搜索失败,请稍后重试。错误信息: ' + (err.message || '未知错误')
    searchResults.value = null
    allSearchResults.value = []

    // 搜索失败时也发射事件，传递空数组
    emit('search-complete', [])
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchWorks()
  // 滚动到顶部
  window.scrollTo({top: 0, behavior: 'smooth'})
}

// 清除筛选
const clearFilters = () => {
  filters.value = {
    fromYear: null,
    toYear: null,
    openAccess: '',
    minCitations: null,
    maxCitations: null,
    type: ''
  }
  sortBy.value = 'relevance_score'
  sortOrder.value = 'desc'
}

// 格式化方法
const formatAuthors = (authorships) => {
  if (!authorships || authorships.length === 0) return '未知作者'

  const authors = authorships
    .slice(0, 3)
    .map(a => a.author?.display_name || '未知')
    .join(', ')

  if (authorships.length > 3) {
    return `${authors}, 等 ${authorships.length} 位作者`
  }
  return authors
}

const formatType = (type) => {
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
  // 截取前 300 个字符
  return fullText.length > 300 ? fullText.slice(0, 300) + '...' : fullText
}

// 从 OpenAlex URL 中提取 ID
const extractId = (url) => {
  // 例如：https://openalex.org/A2208157607 -> A2208157607
  if (!url) return ''
  return url.split('/').pop()
}

// 处理实体点击事件
const handleEntityClick = (type, id) => {
  if (!id) return
  emit('entity-click', { type, id })
}

// 加载指定作者的文章（供父组件调用）
const loadAuthorWorks = async (authorId) => {
  loading.value = true
  error.value = null
  isAuthorWorksMode.value = true
  searchQuery.value = '' // 清空搜索关键词

  // 重置页码到第一页
  currentPage.value = 1

  try {
    const response = await import('@/api/openalex.api').then(m =>
      m.getWorksByAuthor(authorId, {
        page: currentPage.value,
        perPage: perPage.value,
        sortBy: 'publication_date', // 使用发表日期排序，而不是相关性
        sortOrder: 'desc'
      })
    )

    allSearchResults.value = response.data.results
    searchResults.value = response.data.results
    totalResults.value = response.data.meta.count

    // 重置所有二次筛选
    selectedTopics.value = []
    selectedInstitutions.value = []
    selectedTypes.value = []
    selectedSources.value = []
    selectedPublishers.value = []
    selectedCountries.value = []
    selectedAuthors.value = []

    // 发射搜索完成事件，将结果传递给父组件
    emit('search-complete', searchResults.value)
  } catch (err) {
    console.error('加载作者文章失败:', err)
    error.value = '加载作者文章失败，请稍后重试。错误信息: ' + (err.message || '未知错误')
    searchResults.value = null
    allSearchResults.value = []
    emit('search-complete', [])
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  loadAuthorWorks
})
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(10px);
}

.gap-2 {
  gap: 8px;
}

a {
  color: rgb(var(--v-theme-primary));
  transition: opacity 0.2s;
}

a:hover {
  opacity: 0.7;
}

/* 搜索工具栏样式 */
.search-toolbar {
  position: relative;
}

/* 端点选择器样式 */
.endpoint-selector-btn {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  padding: 0 8px;
  min-width: auto;
  height: 32px;
}

.endpoint-selector-text {
  font-size: 14px;
}

.endpoint-menu {
  min-width: 280px;
}

.endpoint-menu .v-list-item {
  padding: 12px 16px;
}

.endpoint-menu .v-list-item-title {
  font-weight: 500;
  font-size: 14px;
}

.endpoint-menu .v-list-item-subtitle {
  margin-top: 2px;
  opacity: 0.7;
  font-size: 12px;
}

.toolbar-icon {
  margin: 0 4px;
}

/* 筛选菜单样式 */
.filter-menu {
  min-width: 280px;
  max-height: 600px;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

/* Apple 风格的二次筛选器样式 */
.facets-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.facet-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.facet-card:hover {
  border-color: rgba(0, 122, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.facet-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.3) 100%
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background 0.2s ease;
}

.facet-header:hover {
  background: linear-gradient(
    180deg,
    rgba(0, 122, 255, 0.05) 0%,
    rgba(0, 122, 255, 0.02) 100%
  );
}

.facet-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: -0.2px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.toggle-icon {
  color: rgba(0, 0, 0, 0.4);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon.rotate {
  transform: rotate(180deg);
}

.facet-content {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.facet-content::-webkit-scrollbar {
  width: 6px;
}

.facet-content::-webkit-scrollbar-track {
  background: transparent;
}

.facet-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.facet-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.facet-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  user-select: none;
}

.facet-item:hover {
  background: rgba(0, 122, 255, 0.08);
}

.facet-item.active {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.12) 0%,
    rgba(0, 122, 255, 0.08) 100%
  );
  border-left: 3px solid rgba(0, 122, 255, 0.6);
  padding-left: 9px;
}

.facet-checkbox {
  flex-shrink: 0;
  margin-right: 8px;
  pointer-events: none;
}

.facet-label {
  flex: 1;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.facet-item.active .facet-label {
  color: rgba(0, 122, 255, 0.9);
  font-weight: 500;
}

.facet-count {
  flex-shrink: 0;
  margin-left: 8px;
  background: rgba(0, 0, 0, 0.06) !important;
  color: rgba(0, 0, 0, 0.6) !important;
  font-weight: 600;
  min-width: 32px;
  justify-content: center;
}

.facet-item.active .facet-count {
  background: rgba(0, 122, 255, 0.15) !important;
  color: rgba(0, 122, 255, 0.9) !important;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .facet-content {
    max-height: 200px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .facets-container {
    background: linear-gradient(
      135deg,
      rgba(40, 40, 40, 0.05) 0%,
      rgba(40, 40, 40, 0.02) 100%
    );
    border-color: rgba(255, 255, 255, 0.08);
  }

  .facet-card {
    background: rgba(30, 30, 30, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .facet-card:hover {
    border-color: rgba(0, 122, 255, 0.3);
  }

  .facet-header {
    background: linear-gradient(
      180deg,
      rgba(40, 40, 40, 0.6) 0%,
      rgba(30, 30, 30, 0.3) 100%
    );
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  .facet-header:hover {
    background: linear-gradient(
      180deg,
      rgba(0, 122, 255, 0.1) 0%,
      rgba(0, 122, 255, 0.05) 100%
    );
  }

  .facet-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .toggle-icon {
    color: rgba(255, 255, 255, 0.5);
  }

  .facet-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  .facet-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .facet-item:hover {
    background: rgba(0, 122, 255, 0.12);
  }

  .facet-item.active {
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.2) 0%,
      rgba(0, 122, 255, 0.15) 100%
    );
    border-left-color: rgba(0, 122, 255, 0.8);
  }

  .facet-label {
    color: rgba(255, 255, 255, 0.8);
  }

  .facet-item.active .facet-label {
    color: rgba(0, 122, 255, 1);
  }

  .facet-count {
    background: rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.6) !important;
  }

  .facet-item.active .facet-count {
    background: rgba(0, 122, 255, 0.25) !important;
    color: rgba(0, 122, 255, 1) !important;
  }
}

/* 实体链接样式 */
.author-link,
.source-link {
  color: rgba(0, 122, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.author-link:hover,
.source-link:hover {
  color: rgba(0, 122, 255, 1);
  border-bottom-color: rgba(0, 122, 255, 0.4);
}

.work-title-link {
  color: rgba(0, 0, 0, 0.87);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 2px solid transparent;
}

.work-title-link:hover {
  color: rgba(0, 122, 255, 0.9);
  border-bottom-color: rgba(0, 122, 255, 0.3);
}

.doi-link {
  color: rgba(0, 0, 0, 0.54);
  text-decoration: none;
  transition: color 0.2s ease;
}

.doi-link:hover {
  color: rgba(0, 122, 255, 0.9);
}
</style>