<template>
  <div class="apple-container">
    <!-- 标题栏 -->
    <div class="apple-header">
      <div class="header-content">
        <h2 class="apple-title">数据分析</h2>
        <v-btn
          icon="mdi-arrow-clockwise"
          variant="text"
          class="refresh-btn"
          @click="renderCharts"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasData" class="empty-state">
      <div class="empty-icon">
        <v-icon size="64" color="rgba(0,0,0,0.15)">mdi-chart-box-outline</v-icon>
      </div>
      <p class="empty-text">执行搜索查看统计数据</p>
    </div>

    <!-- 数据内容 -->
    <div v-else class="apple-content">
      <!-- 统计卡片网格 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalWorks }}</div>
          <div class="stat-label">总文章数</div>
          <div class="stat-icon">
            <v-icon size="20" color="rgba(0,122,255,0.2)">mdi-file-document-multiple</v-icon>
          </div>
        </div>

        <div class="stat-card stat-card-success">
          <div class="stat-value">{{ openAccessCount }}</div>
          <div class="stat-label">开放获取</div>
          <div class="stat-icon">
            <v-icon size="20" color="rgba(52,199,89,0.2)">mdi-lock-open-variant</v-icon>
          </div>
        </div>

        <div class="stat-card stat-card-info">
          <div class="stat-value">{{ avgCitations }}</div>
          <div class="stat-label">平均引用</div>
          <div class="stat-icon">
            <v-icon size="20" color="rgba(90,200,250,0.2)">mdi-format-quote-close</v-icon>
          </div>
        </div>

        <div class="stat-card stat-card-warning">
          <div class="stat-value">{{ yearRange }}</div>
          <div class="stat-label">年份跨度</div>
          <div class="stat-icon">
            <v-icon size="20" color="rgba(255,159,10,0.2)">mdi-calendar-range</v-icon>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-container">
          <div ref="yearChartRef" class="chart"></div>
        </div>

        <div class="chart-container">
          <div ref="oaChartRef" class="chart"></div>
        </div>

        <div class="chart-container chart-full">
          <div ref="citationChartRef" class="chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue'
import * as echarts from 'echarts'
import {useTheme} from 'vuetify'

const props = defineProps({
  works: {
    type: Array,
    default: () => []
  }
})

const theme = useTheme()
const yearChartRef = ref(null)
const oaChartRef = ref(null)
const citationChartRef = ref(null)

let yearChart = null
let oaChart = null
let citationChart = null

// 工具函数：获取主题颜色
const getThemeColor = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--v-theme-${name}`)
    .trim()
  return raw ? `rgb(${raw})` : fallback
}

// 计算属性
const hasData = computed(() => props.works && props.works.length > 0)

const totalWorks = computed(() => props.works.length)

const openAccessCount = computed(() => {
  return props.works.filter(w => w.open_access?.is_oa).length
})

const avgCitations = computed(() => {
  if (props.works.length === 0) return 0
  const total = props.works.reduce((sum, w) => sum + (w.cited_by_count || 0), 0)
  return Math.round(total / props.works.length)
})

const yearRange = computed(() => {
  if (props.works.length === 0) return '-'
  const years = props.works
    .map(w => w.publication_year)
    .filter(Boolean)
  if (years.length === 0) return '-'
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? `${min}` : `${min}-${max}`
})

// 年份分布数据
const yearDistribution = computed(() => {
  const yearCounts = {}
  props.works.forEach(work => {
    const year = work.publication_year
    if (year) {
      yearCounts[year] = (yearCounts[year] || 0) + 1
    }
  })

  const sorted = Object.entries(yearCounts)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

  return {
    years: sorted.map(([year]) => year),
    counts: sorted.map(([, count]) => count)
  }
})

// 开放获取统计
const oaDistribution = computed(() => {
  const oaCount = props.works.filter(w => w.open_access?.is_oa).length
  const nonOaCount = props.works.length - oaCount

  return [
    {value: oaCount, name: '开放获取'},
    {value: nonOaCount, name: '非开放获取'}
  ]
})

// 引用数分布（分段统计）
const citationDistribution = computed(() => {
  const ranges = [
    {label: '0-10', min: 0, max: 10, count: 0},
    {label: '11-50', min: 11, max: 50, count: 0},
    {label: '51-100', min: 51, max: 100, count: 0},
    {label: '101-500', min: 101, max: 500, count: 0},
    {label: '500+', min: 501, max: Infinity, count: 0}
  ]

  props.works.forEach(work => {
    const citations = work.cited_by_count || 0
    const range = ranges.find(r => citations >= r.min && citations <= r.max)
    if (range) range.count++
  })

  return {
    labels: ranges.map(r => r.label),
    counts: ranges.map(r => r.count)
  }
})

// 渲染年份分布图
const renderYearChart = () => {
  if (!yearChartRef.value || yearDistribution.value.years.length === 0) return

  if (!yearChart) {
    yearChart = echarts.init(yearChartRef.value)
  }

  const option = {
    title: {
      text: '年份分布',
      left: 'center',
      top: 10,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 0,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 13
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 122, 255, 0.08)'
        }
      },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);'
    },
    grid: {
      left: '8%',
      right: '5%',
      bottom: '15%',
      top: '20%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: yearDistribution.value.years,
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
          width: 1
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        rotate: 45,
        margin: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.06)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    },
    series: [{
      name: '文章数',
      type: 'bar',
      data: yearDistribution.value.counts,
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0, 122, 255, 0.9)' },
          { offset: 1, color: 'rgba(0, 122, 255, 0.6)' }
        ]),
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 122, 255, 1)' },
            { offset: 1, color: 'rgba(0, 122, 255, 0.8)' }
          ])
        }
      }
    }]
  }

  yearChart.setOption(option)
}

// 渲染开放获取饼图
const renderOAChart = () => {
  if (!oaChartRef.value) return

  if (!oaChart) {
    oaChart = echarts.init(oaChartRef.value)
  }

  const option = {
    title: {
      text: '开放获取状态',
      left: 'center',
      top: 10,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 0,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 13
      },
      formatter: '{b}: {c} ({d}%)',
      extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);'
    },
    legend: {
      bottom: 15,
      left: 'center',
      itemGap: 20,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.65)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      },
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10
    },
    series: [{
      name: '开放获取',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: {
        show: true,
        position: 'outside',
        color: 'rgba(0, 0, 0, 0.65)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        formatter: '{d}%'
      },
      labelLine: {
        show: true,
        length: 15,
        length2: 10,
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.15)'
        }
      },
      emphasis: {
        scale: true,
        scaleSize: 8,
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 600
        }
      },
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3
      },
      data: oaDistribution.value,
      color: [
        new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: 'rgba(52, 199, 89, 0.9)' },
          { offset: 1, color: 'rgba(52, 199, 89, 0.7)' }
        ]),
        new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: 'rgba(255, 159, 10, 0.9)' },
          { offset: 1, color: 'rgba(255, 159, 10, 0.7)' }
        ])
      ]
    }]
  }

  oaChart.setOption(option)
}

// 渲染引用数分布图
const renderCitationChart = () => {
  if (!citationChartRef.value) return

  if (!citationChart) {
    citationChart = echarts.init(citationChartRef.value)
  }

  const option = {
    title: {
      text: '引用数分布',
      left: 'center',
      top: 10,
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 0,
      borderRadius: 12,
      padding: [12, 16],
      textStyle: {
        color: 'rgba(0, 0, 0, 0.85)',
        fontSize: 13
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(90, 200, 250, 0.08)'
        }
      },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);'
    },
    grid: {
      left: '8%',
      right: '5%',
      bottom: '12%',
      top: '20%',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: citationDistribution.value.labels,
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.1)',
          width: 1
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        margin: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.06)',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif'
      }
    },
    series: [{
      name: '文章数',
      type: 'bar',
      data: citationDistribution.value.counts,
      barWidth: '50%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(90, 200, 250, 0.9)' },
          { offset: 1, color: 'rgba(90, 200, 250, 0.6)' }
        ]),
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(90, 200, 250, 1)' },
            { offset: 1, color: 'rgba(90, 200, 250, 0.8)' }
          ])
        }
      }
    }]
  }

  citationChart.setOption(option)
}

// 渲染所有图表
const renderCharts = () => {
  if (!hasData.value) return

  setTimeout(() => {
    renderYearChart()
    renderOAChart()
    renderCitationChart()
  }, 100)
}

// 窗口调整处理
const handleResize = () => {
  yearChart?.resize()
  oaChart?.resize()
  citationChart?.resize()
}

// 监听数据变化
watch(() => props.works, () => {
  renderCharts()
}, {deep: true})

// 监听主题变化
watch(
  () => theme.global.name.value,
  () => {
    renderCharts()
  }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (hasData.value) {
    renderCharts()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  yearChart?.dispose()
  oaChart?.dispose()
  citationChart?.dispose()
})
</script>

<style scoped>
/* Apple 风格容器 */
.apple-container {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: saturate(180%) blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.apple-container:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12),
              0 2px 4px rgba(0, 0, 0, 0.08);
}

/* 标题栏 */
.apple-header {
  padding: 24px 32px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(180deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.4) 100%);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.apple-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.refresh-btn {
  opacity: 0.6;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  opacity: 1;
  transform: rotate(90deg);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  min-height: 400px;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-text {
  font-size: 15px;
  color: rgba(0, 0, 0, 0.4);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.2px;
}

/* 内容区域 */
.apple-content {
  padding: 32px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  position: relative;
  background: linear-gradient(135deg,
    rgba(0, 122, 255, 0.05) 0%,
    rgba(0, 122, 255, 0.02) 100%);
  border: 1px solid rgba(0, 122, 255, 0.12);
  border-radius: 16px;
  padding: 24px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(0, 122, 255, 0.6) 0%,
    rgba(0, 122, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.25);
}

.stat-card:hover::before {
  opacity: 1;
}

/* 成功色卡片 */
.stat-card-success {
  background: linear-gradient(135deg,
    rgba(52, 199, 89, 0.05) 0%,
    rgba(52, 199, 89, 0.02) 100%);
  border-color: rgba(52, 199, 89, 0.12);
}

.stat-card-success::before {
  background: linear-gradient(90deg,
    rgba(52, 199, 89, 0.6) 0%,
    rgba(52, 199, 89, 0) 100%);
}

.stat-card-success:hover {
  box-shadow: 0 12px 24px rgba(52, 199, 89, 0.15);
  border-color: rgba(52, 199, 89, 0.25);
}

/* 信息色卡片 */
.stat-card-info {
  background: linear-gradient(135deg,
    rgba(90, 200, 250, 0.05) 0%,
    rgba(90, 200, 250, 0.02) 100%);
  border-color: rgba(90, 200, 250, 0.12);
}

.stat-card-info::before {
  background: linear-gradient(90deg,
    rgba(90, 200, 250, 0.6) 0%,
    rgba(90, 200, 250, 0) 100%);
}

.stat-card-info:hover {
  box-shadow: 0 12px 24px rgba(90, 200, 250, 0.15);
  border-color: rgba(90, 200, 250, 0.25);
}

/* 警告色卡片 */
.stat-card-warning {
  background: linear-gradient(135deg,
    rgba(255, 159, 10, 0.05) 0%,
    rgba(255, 159, 10, 0.02) 100%);
  border-color: rgba(255, 159, 10, 0.12);
}

.stat-card-warning::before {
  background: linear-gradient(90deg,
    rgba(255, 159, 10, 0.6) 0%,
    rgba(255, 159, 10, 0) 100%);
}

.stat-card-warning:hover {
  box-shadow: 0 12px 24px rgba(255, 159, 10, 0.15);
  border-color: rgba(255, 159, 10, 0.25);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -1px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  opacity: 0.6;
  transform: scale(1.1);
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-container {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 350px;
}

.chart-container:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.chart-full {
  grid-column: 1 / -1;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-header {
    padding: 20px 24px 16px;
  }

  .apple-title {
    font-size: 24px;
  }

  .apple-content {
    padding: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 20px 16px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-label {
    font-size: 11px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .chart {
    height: 250px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .apple-container {
    background: rgba(30, 30, 30, 0.7);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4),
                0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .apple-header {
    background: linear-gradient(180deg,
      rgba(40, 40, 40, 0.8) 0%,
      rgba(30, 30, 30, 0.4) 100%);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .apple-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .empty-text {
    color: rgba(255, 255, 255, 0.5);
  }

  .stat-value {
    color: rgba(255, 255, 255, 0.9);
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.5);
  }

  .chart-container {
    background: rgba(40, 40, 40, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .chart-container:hover {
    background: rgba(50, 50, 50, 0.8);
  }
}
</style>
