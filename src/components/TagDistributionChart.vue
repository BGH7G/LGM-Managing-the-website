<template>
  <v-card class="glass-card">
    <v-card-title class="d-flex align-center">
      <span class="text-h5 font-weight-bold">耗材标签分布</span>
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

  const primary = getThemeColor('primary', '#2D3A8C')
  const accent = getThemeColor('secondary', '#5BA6A6')
  const axis = getThemeColor('muted', '#475467')
  const border = getThemeColor('border', '#E5E7EB')

  const names = entries.map(([name]) => name)
  const values = entries.map(([, count]) => count)

  const option = {
    color: [primary],
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'shadow'}
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: {lineStyle: {color: axis}},
      splitLine: {lineStyle: {color: border}},
      axisLabel: {color: axis}
    },
    yAxis: {
      type: 'category',
      data: names,
      axisTick: {show: false},
      axisLine: {lineStyle: {color: axis}},
      axisLabel: {color: axis}
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: values,
        barWidth: '60%',
        itemStyle: {
          color: primary,
          borderRadius: [6, 6, 6, 6]
        },
        emphasis: {
          itemStyle: {color: accent}
        }
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
