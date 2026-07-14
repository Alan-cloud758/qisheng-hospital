<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      <el-button type="primary" @click="openCreate">新增</el-button>
    </div>

    <section class="panel resource-panel">
      <div class="resource-toolbar">
        <el-input v-model="keyword" clearable placeholder="输入关键字" @keyup.enter="search" />
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="load">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column v-for="column in columns" :key="column.key" :label="column.label" min-width="140">
          <template #default="{ row }">
            {{ display(row, column.key) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="190">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="toggleable" size="small" type="warning" @click="toggle(row)">
              {{ activeText(row) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="resource-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @current-change="load"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑' : '新增'" width="560px">
      <el-form label-width="96px">
        <el-form-item v-for="field in fields" :key="field.key" :label="field.label" :required="field.required">
          <el-input
            v-if="field.type === 'textarea'"
            v-model="form[field.key]"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
          <el-input-number v-else-if="field.type === 'number'" v-model="form[field.key]" :min="0" />
          <el-switch v-else-if="field.type === 'boolean'" v-model="form[field.key]" />
          <el-input v-else v-model="form[field.key]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createAdminResource, fetchAdminResource, toggleAdminResource, updateAdminResource } from '../api/hospital'

export type FieldConfig = { key: string; label: string; required?: boolean; type?: 'text' | 'number' | 'textarea' | 'boolean' }
export type ColumnConfig = { key: string; label: string }

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    subtitle?: string
    resource: string
    columns: ColumnConfig[]
    fields: FieldConfig[]
    toggleable?: boolean
  }>(),
  {
    eyebrow: 'Hospital Module',
    subtitle: '',
    toggleable: true,
  },
)

const keyword = ref('')
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const rows = ref<Record<string, unknown>[]>([])
const form = reactive<Record<string, unknown>>({})
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

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
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function resetForm(row?: Record<string, unknown>) {
  for (const key of Object.keys(form)) {
    delete form[key]
  }

  for (const field of props.fields) {
    form[field.key] = row ? valueAt(row, field.key) : field.type === 'boolean' ? true : ''
  }
}

function activeText(row: Record<string, unknown>) {
  if (row.status) return row.status === 'ACTIVE' ? '停用' : '启用'
  return row.isActive === false ? '启用' : '停用'
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Record<string, unknown>) {
  editingId.value = String(row.id)
  resetForm(row)
  dialogVisible.value = true
}

async function load() {
  loading.value = true
  try {
    const result = await fetchAdminResource(props.resource, { keyword: keyword.value, page: page.value, pageSize: pageSize.value })
    rows.value = result.items as Record<string, unknown>[]
    total.value = result.pagination.total
    page.value = result.pagination.page
    pageSize.value = result.pagination.pageSize
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  void load()
}

function handleSizeChange() {
  page.value = 1
  void load()
}

async function save() {
  saving.value = true
  try {
    if (editingId.value) {
      await updateAdminResource(props.resource, editingId.value, form)
    } else {
      await createAdminResource(props.resource, form)
    }
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function toggle(row: Record<string, unknown>) {
  await toggleAdminResource(props.resource, String(row.id))
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.resource-panel {
  display: grid;
  gap: 16px;
}

.resource-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto auto 1fr;
  gap: 12px;
  align-items: center;
}

.resource-pagination {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .resource-toolbar {
    grid-template-columns: 1fr;
  }

  .resource-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
