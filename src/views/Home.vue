<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12" md="6">
        <LocationWithSheep />
      </v-col>
      <v-col cols="12" md="6">
        <TagDistributionChart />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import LocationWithSheep from '@/components/LocationWithSheep.vue'
import TagDistributionChart from '@/components/TagDistributionChart.vue'
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
