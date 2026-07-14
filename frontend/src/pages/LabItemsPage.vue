<template>
  <AdminResourcePage
    eyebrow="LIS"
    title="检验项目"
    subtitle="维护本地 mock LIS 可申请的检验项目、参考范围和价格。"
    resource="lab-items"
    :columns="columns"
    :fields="fields"
  />
</template>

<script setup lang="ts">
import AdminResourcePage from './AdminResourcePage.vue'

const columns = [
  { key: 'code', label: '编码' },
  { key: 'name', label: '项目' },
  { key: 'specimenType', label: '标本' },
  { key: 'unit', label: '单位' },
  { key: 'price', label: '价格' },
]

const fields = [
  { key: 'code', label: '编码', required: true },
  { key: 'name', label: '项目', required: true },
  { key: 'specimenType', label: '标本类型', required: true },
  { key: 'unit', label: '单位' },
  { key: 'referenceLow', label: '参考低值', type: 'number' as const },
  { key: 'referenceHigh', label: '参考高值', type: 'number' as const },
  { key: 'price', label: '价格', type: 'number' as const },
]
</script>
