<template>
  <v-card class="glass-card">
    <v-card-title class="text-h5">
      羊只分布情况
    </v-card-title>
    <v-card-text>
      <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getInfo } from '@/api/data.api'

const chartContainer = ref(null)
let chart = null

const fetchData = async () => {
  try {
    const response = await getInfo()
    if (response.data && response.data.success) {
      const sheepData = response.data.data
      
      // 按Location分组统计
      const locationGroups = {}
      
      sheepData.forEach(sheep => {
        if (sheep.Location) {
          const locationName = sheep.Location.farm_name
          if (!locationGroups[locationName]) {
            locationGroups[locationName] = 0
          }
          locationGroups[locationName]++
        }
      })
      
      // 转换为ECharts所需的数据格式
      const chartData = Object.keys(locationGroups).map(location => ({
        name: location,
        value: locationGroups[location]
      }))
      
      renderChart(chartData)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const renderChart = (data) => {
  if (!chartContainer.value) return
  
  // 确保图表实例存在
  if (!chart) {
    chart = echarts.init(chartContainer.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '牧场分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
  
  chart.setOption(option)
  
  // 添加窗口大小变化时的自适应调整
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 监听窗口大小变化的函数
const handleResize = () => {
  if (chart) chart.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 清理图表实例和事件监听
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.v-card {
  margin-bottom: 20px;
}
</style>
