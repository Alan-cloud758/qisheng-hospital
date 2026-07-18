<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Consumables</p>
        <h1 class="page-title">物资耗材管理</h1>
        <p class="page-subtitle">查看耗材目录、批次库存和出入库流水。</p>
      </div>
      <el-button @click="loadAll" :loading="loading">刷新</el-button>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="耗材目录" name="catalog">
        <section class="panel">
          <el-table v-loading="loading" :data="catalog" border stripe>
            <el-table-column label="编码" prop="code" width="130" />
            <el-table-column label="名称" prop="name" min-width="180" />
            <el-table-column label="规格" prop="spec" width="130" />
            <el-table-column label="单位" prop="unit" width="80" />
            <el-table-column label="单价" width="110">
              <template #default="{ row }">
                <span style="font-weight:600;color:var(--color-success);">{{ row.price != null ? `¥${row.price}` : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分类" prop="category" width="120" />
            <el-table-column label="最低库存" prop="minStock" width="100" />
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="批次库存" name="batches">
        <section class="panel">
          <el-table v-loading="loading" :data="batches" border stripe>
            <el-table-column label="耗材" min-width="180">
              <template #default="{ row }">{{ row.catalogName || row.catalog?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="批号" prop="batchNo" width="150" />
            <el-table-column label="库存" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.quantity <= 0 ? 'var(--color-danger)' : 'inherit', fontWeight: 600 }">{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="有效期" width="130">
              <template #default="{ row }">{{ row.expiryDate || '-' }}</template>
            </el-table-column>
            <el-table-column label="供应商" prop="supplier" min-width="140" />
            <el-table-column label="入库时间" min-width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="出入库流水" name="movements">
        <section class="panel">
          <el-table v-loading="loading" :data="movements" border stripe>
            <el-table-column label="耗材" min-width="180">
              <template #default="{ row }">{{ row.catalogName || row.catalog?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="批号" prop="batchNo" width="150">
              <template #default="{ row }">{{ row.batchNo || row.batch?.batchNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <span class="badge" :class="row.type === 'IN' ? 'badge-success' : 'badge-danger'">
                  {{ row.type === 'IN' ? '入库' : '出库' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }">
                  {{ row.type === 'OUT' ? '-' : '+' }}{{ row.quantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="原因" prop="reason" min-width="140" />
            <el-table-column label="操作人" min-width="100">
              <template #default="{ row }">{{ row.operatorName || row.operator?.displayName || '-' }}</template>
            </el-table-column>
            <el-table-column label="时间" min-width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { apiClient } from '../api/client'

interface CatalogItem {
  id: string
  code: string
  name: string
  spec?: string
  unit?: string
  price?: number
  category?: string
  minStock?: number
}

interface BatchItem {
  id: string
  catalogName?: string
  catalog?: { name?: string }
  batchNo: string
  quantity: number
  expiryDate?: string
  supplier?: string
  createdAt?: string
}

interface Movement {
  id: string
  catalogName?: string
  catalog?: { name?: string }
  batchNo?: string
  batch?: { batchNo?: string }
  type: string
  quantity: number
  reason?: string
  operatorName?: string
  operator?: { displayName?: string }
  createdAt?: string
}

const loading = ref(false)
const activeTab = ref('catalog')
const catalog = ref<CatalogItem[]>([])
const batches = ref<BatchItem[]>([])
const movements = ref<Movement[]>([])

function formatDate(val?: string) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function loadAll() {
  loading.value = true
  try {
    const [catRes, batchRes, movRes] = await Promise.all([
      apiClient.get('/admin/consumables/catalog'),
      apiClient.get('/admin/consumables/batches'),
      apiClient.get('/admin/consumables/movements'),
    ])
    catalog.value = Array.isArray(catRes.data) ? catRes.data : (catRes.data.data ?? catRes.data.items ?? [])
    batches.value = Array.isArray(batchRes.data) ? batchRes.data : (batchRes.data.data ?? batchRes.data.items ?? [])
    movements.value = Array.isArray(movRes.data) ? movRes.data : (movRes.data.data ?? movRes.data.items ?? [])
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadAll() })
</script>

<style scoped>
.el-tabs {
  margin-bottom: var(--space-2);
}
</style>
