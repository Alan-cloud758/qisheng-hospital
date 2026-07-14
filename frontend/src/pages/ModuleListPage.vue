<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle">{{ subtitle }}</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column v-for="column in columns" :key="column.key" :label="column.label" min-width="140">
          <template #default="{ row }">
            {{ display(row, column.key) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && rows.length === 0" description="暂无数据" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminResource } from '../api/hospital'

const props = defineProps<{
  eyebrow: string
  title: string
  subtitle: string
  resource: string
  columns: Array<{ key: string; label: string }>
}>()

const loading = ref(false)
const rows = ref<Record<string, unknown>[]>([])

function valueAt(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, row)
}

function display(row: Record<string, unknown>, path: string) {
  const value = valueAt(row, path)
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return `${value.length} 条`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchAdminResource(props.resource)) as Record<string, unknown>[]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
