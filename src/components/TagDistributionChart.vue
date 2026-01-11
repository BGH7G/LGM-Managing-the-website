<template>
  <v-card class="glass-card">
    <v-card-title class="d-flex align-center">
      <span class="text-h5 font-weight-bold">耗材统计</span>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        color="primary"
        :loading="loading"
        @click="fetchTagData"
      />
    </v-card-title>
    <v-card-text>
      <div ref="chartRef" style="width: 100%; height: 360px;"></div>
      <div
        v-if="chartEmpty"
        class="text-center text-body-2 text-brand-muted mt-4"
      >
        暂无标签数据
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import {ref, onMounted, onUnmounted, watch} from 'vue'
import * as echarts from 'echarts'
import {getGoods} from '@/api/goods.api'
import {useTheme} from 'vuetify'

const chartRef = ref(null)
const loading = ref(false)
const chartEmpty = ref(false)
const tagEntries = ref([])
let chart = null

const theme = useTheme()

const getThemeColor = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--v-theme-${name}`)
    .trim()
  return raw ? `rgb(${raw})` : fallback
}

const renderChart = (entries) => {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  if (!entries || entries.length === 0) {
    chart.clear()
    return
  }

  const axis = getThemeColor('muted', '#475467')

  // 将数据转换为 ECharts 所需的格式
  const chartData = entries.map(([name, count]) => ({
    value: count,
    name: name
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      top: 'bottom',
      textStyle: {
        color: axis
      }
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {
          show: true,
          title: '保存为图片'
        }
      }
    },
    series: [
      {
        name: '标签分布',
        type: 'pie',
        radius: [50, 180],
        center: ['50%', '50%'],
        roseType: 'area',
        itemStyle: {
          borderRadius: 8
        },
        label: {
          color: axis
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: chartData
      }
    ]
  }

  chart.setOption(option)
}

const fetchTagData = async () => {
  loading.value = true
  try {
    const res = await getGoods({page: 1, pageSize: 500, sortBy: 'updatedAt', sortOrder: 'DESC'})
    const list = res?.data?.data || []

    const counts = {}
    list.forEach((item) => {
      (item.Tags || []).forEach((tag) => {
        if (!tag?.name) return
        counts[tag.name] = (counts[tag.name] || 0) + 1
      })
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    tagEntries.value = sorted
    chartEmpty.value = sorted.length === 0
    renderChart(sorted)
  } catch (err) {
    console.error('获取标签数据失败:', err)
    chartEmpty.value = true
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  fetchTagData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(
  () => theme.global.name.value,
  () => renderChart(tagEntries.value)
)
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
