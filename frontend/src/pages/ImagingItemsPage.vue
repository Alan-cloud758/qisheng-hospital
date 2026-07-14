<template>
  <AdminResourcePage
    eyebrow="PACS"
    title="影像项目"
    subtitle="维护本地 mock PACS 可申请的影像项目、检查部位和价格。"
    resource="imaging-items"
    :columns="columns"
    :fields="fields"
  />
</template>

<script setup lang="ts">
import AdminResourcePage from './AdminResourcePage.vue'

const columns = [
  { key: 'code', label: '编码' },
  { key: 'name', label: '项目' },
  { key: 'modality', label: '类型' },
  { key: 'bodyPart', label: '部位' },
  { key: 'price', label: '价格' },
]

const fields = [
  { key: 'code', label: '编码', required: true },
  { key: 'name', label: '项目', required: true },
  { key: 'modality', label: '类型', required: true },
  { key: 'bodyPart', label: '部位', required: true },
  { key: 'price', label: '价格', type: 'number' as const },
]
</script>
