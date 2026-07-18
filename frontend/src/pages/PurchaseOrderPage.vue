<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Procurement</p>
        <h1 class="page-title">采购管理</h1>
        <p class="page-subtitle">管理药品采购订单、供应商和库存盘点。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadTab">
      <!-- 采购订单 -->
      <el-tab-pane label="采购订单" name="orders">
        <div class="toolbar">
          <el-select v-model="orderStatusFilter" placeholder="状态筛选" clearable @change="loadOrders" style="width:140px">
            <el-option label="待审批" value="PENDING" /><el-option label="已审批" value="APPROVED" />
            <el-option label="已收货" value="RECEIVED" /><el-option label="已取消" value="CANCELLED" />
          </el-select>
          <el-button type="primary" @click="openCreateOrder">新建订单</el-button>
        </div>
        <el-table :data="orders" border stripe v-loading="loading">
          <el-table-column label="订单号" prop="orderNo" width="150" />
          <el-table-column label="供应商" prop="supplierName" />
          <el-table-column label="品项数" width="80"><template #default="{ row }">{{ row.items?.length || 0 }}</template></el-table-column>
          <el-table-column label="总金额" width="120"><template #default="{ row }">{{ row.totalAmount ?? '-' }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="orderTagType(row.status)" size="small">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="下单日期" width="120"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button v-if="row.status==='PENDING'" size="small" type="success" @click="approveOrder(row.id)">审批</el-button>
              <el-button v-if="row.status==='APPROVED'" size="small" type="primary" @click="receiveOrder(row.id)">收货</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 供应商管理 -->
      <el-tab-pane label="供应商管理" name="suppliers">
        <div class="toolbar"><el-button type="primary" @click="supplierVisible=true">新增供应商</el-button></div>
        <el-table :data="suppliers" border stripe v-loading="loading">
          <el-table-column label="名称" prop="name" />
          <el-table-column label="联系人" prop="contact" />
          <el-table-column label="电话" prop="phone" />
          <el-table-column label="地址" prop="address" show-overflow-tooltip />
          <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.isActive?'success':'info'" size="small">{{ row.isActive?'启用':'停用' }}</el-tag></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 药品效期 -->
      <el-tab-pane label="药品效期" name="expiry">
        <el-table :data="expiryItems" border stripe v-loading="loading">
          <el-table-column label="药品" prop="drugName" />
          <el-table-column label="批号" prop="batchNo" />
          <el-table-column label="库存" prop="quantity" width="80" />
          <el-table-column label="有效期" width="120"><template #default="{ row }"><span :class="expiryClass(row.expiresAt)">{{ fmt(row.expiresAt) }}</span></template></el-table-column>
          <el-table-column label="供应商" prop="supplier" />
        </el-table>
      </el-tab-pane>

      <!-- 库存盘点 -->
      <el-tab-pane label="库存盘点" name="stocktake">
        <el-table :data="stockItems" border stripe v-loading="loading">
          <el-table-column label="药品" prop="drugName" />
          <el-table-column label="批号" prop="batchNo" />
          <el-table-column label="系统库存" prop="quantity" width="100" />
          <el-table-column label="实盘数量" width="120">
            <template #default="{ row }"><el-input-number v-model="row.actualQty" :min="0" size="small" controls-position="right" style="width:90px" /></template>
          </el-table-column>
          <el-table-column label="差异" width="90"><template #default="{ row }">{{ row.actualQty != null ? row.actualQty - row.quantity : '-' }}</template></el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }"><el-button size="small" :disabled="row.actualQty==null" @click="submitStocktake(row)">提交</el-button></template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建采购订单 -->
    <el-dialog v-model="orderVisible" title="新建采购订单" width="600px" destroy-on-close>
      <el-form label-width="86px">
        <el-form-item label="供应商">
          <el-select v-model="orderForm.supplierId" filterable placeholder="选择供应商">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="药品明细">
          <div v-for="(item, idx) in orderForm.items" :key="idx" class="order-item-row">
            <el-select v-model="item.drugId" filterable placeholder="药品" style="flex:2">
              <el-option v-for="d in drugs" :key="d.id" :label="`${d.name} ${d.spec}`" :value="d.id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" style="flex:1" />
            <el-button type="danger" text @click="orderForm.items.splice(idx, 1)">移除</el-button>
          </div>
          <el-button @click="orderForm.items.push({ drugId: '', quantity: 1 })" style="margin-top:6px">添加药品</el-button>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="orderForm.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createOrder">提交</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="supplierVisible" title="新增供应商" width="480px">
      <el-form label-width="86px">
        <el-form-item label="名称"><el-input v-model="supplierForm.name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="supplierForm.contact" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="supplierForm.phone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="supplierForm.address" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="supplierVisible=false">取消</el-button><el-button type="primary" @click="createSupplier">保存</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '../api/client'

type Tab = 'orders' | 'suppliers' | 'expiry' | 'stocktake'
const activeTab = ref<Tab>('orders')
const loading = ref(false)
const saving = ref(false)
const fmt = (v?: string) => v ? v.slice(0, 10) : '-'
const orders = ref<Record<string, unknown>[]>([])
const suppliers = ref<Record<string, unknown>[]>([])
const expiryItems = ref<Record<string, unknown>[]>([])
const stockItems = ref<Record<string, unknown>[]>([])
const drugs = ref<Array<{ id: string; name: string; spec: string }>>([])
const orderStatusFilter = ref('')
const orderVisible = ref(false)
const supplierVisible = ref(false)
const orderForm = reactive({ supplierId: '', items: [{ drugId: '', quantity: 1 }], note: '' })
const supplierForm = reactive({ name: '', contact: '', phone: '', address: '' })

function orderTagType(s: string) { return s === 'APPROVED' ? 'success' : s === 'RECEIVED' ? '' : s === 'CANCELLED' ? 'info' : 'warning' }
function expiryClass(d: string) {
  if (!d) return ''
  const diff = new Date(d).getTime() - Date.now()
  return diff < 90 * 864e5 ? 'text-danger' : diff < 180 * 864e5 ? 'text-warn' : ''
}
function openCreateOrder() { orderForm.supplierId = ''; orderForm.items = [{ drugId: '', quantity: 1 }]; orderForm.note = ''; orderVisible.value = true }

async function loadOrders() {
  const params: Record<string, unknown> = {}
  if (orderStatusFilter.value) params.status = orderStatusFilter.value
  const { data } = await apiClient.get('/admin/purchase-orders', { params })
  orders.value = data.items || []
}
async function loadSuppliers() { const { data } = await apiClient.get('/admin/suppliers'); suppliers.value = data.items || [] }
async function loadExpiry() { const { data } = await apiClient.get('/admin/drug-stock/expiry'); expiryItems.value = data.items || [] }
async function loadStocktake() { const { data } = await apiClient.get('/admin/drug-stock/batches'); stockItems.value = (data.items || []).map((r: Record<string, unknown>) => ({ ...r, actualQty: null })) }
async function loadDrugs() { const { data } = await apiClient.get('/admin/drugs', { params: { pageSize: 500 } }); drugs.value = (data.items || []) as Array<{ id: string; name: string; spec: string }> }

async function loadTab() {
  loading.value = true
  try {
    const loaders: Record<Tab, () => Promise<void>> = { orders: loadOrders, suppliers: loadSuppliers, expiry: loadExpiry, stocktake: loadStocktake }
    await loaders[activeTab.value]()
  } finally { loading.value = false }
}
async function approveOrder(id: string) { await apiClient.post(`/admin/purchase-orders/${id}/approve`); ElMessage.success('已审批'); await loadOrders() }
async function receiveOrder(id: string) { await apiClient.post(`/admin/purchase-orders/${id}/receive`); ElMessage.success('已收货'); await loadOrders() }
async function createOrder() {
  if (!orderForm.supplierId) return ElMessage.warning('请选择供应商')
  saving.value = true
  try { await apiClient.post('/admin/purchase-orders', { ...orderForm }); orderVisible.value = false; await loadOrders() } finally { saving.value = false }
}
async function createSupplier() { await apiClient.post('/admin/suppliers', { ...supplierForm }); supplierVisible.value = false; await loadSuppliers() }
async function submitStocktake(row: Record<string, unknown>) { await apiClient.post(`/admin/drug-stock/batches/${row.id}/stocktake`, { actualQuantity: row.actualQty }); ElMessage.success('盘点已提交') }

onMounted(async () => { await Promise.all([loadOrders(), loadDrugs()]) })
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
.order-item-row { display: flex; gap: 8px; margin-bottom: 6px; align-items: center; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-warn { color: #e6a23c; }
</style>
