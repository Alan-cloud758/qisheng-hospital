<template>
  <ModuleListPage
    eyebrow="Hospital Organization"
    title="科室管理"
    subtitle="查看院区下的科室编码、说明和启用状态。"
    resource="departments"
    :columns="columns"
  />
</template>

<script setup lang="ts">
import ModuleListPage from './ModuleListPage.vue'

const columns = [
  { key: 'name', label: '科室' },
  { key: 'code', label: '编码' },
  { key: 'campus.name', label: '院区' },
  { key: 'summary', label: '说明' },
]
</script>
