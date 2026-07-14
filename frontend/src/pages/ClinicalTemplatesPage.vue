<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Clinical Quality</p>
        <h1 class="page-title">临床模板</h1>
        <p class="page-subtitle">维护医生工作台可套用的病历、诊断、医嘱和处方模板。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="病历模板" name="records">
          <div class="template-toolbar">
            <el-button type="primary" @click="openRecord()">新增病历模板</el-button>
          </div>
          <el-table v-loading="loading" :data="records" border stripe>
            <el-table-column label="名称" prop="name" min-width="160" />
            <el-table-column label="摘要" prop="summary" min-width="260" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ row.isActive ? '启用' : '停用' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button size="small" @click="openRecord(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="常用诊断" name="diagnoses">
          <div class="template-toolbar">
            <el-button type="primary" @click="openDiagnosis()">新增诊断</el-button>
          </div>
          <el-table v-loading="loading" :data="diagnoses" border stripe>
            <el-table-column label="编码" prop="code" width="120" />
            <el-table-column label="名称" prop="name" min-width="180" />
            <el-table-column label="备注" prop="note" min-width="220" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button size="small" @click="openDiagnosis(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="常用医嘱" name="orders">
          <div class="template-toolbar">
            <el-button type="primary" @click="openOrder()">新增医嘱</el-button>
          </div>
          <el-table v-loading="loading" :data="orders" border stripe>
            <el-table-column label="类型" prop="type" width="140" />
            <el-table-column label="内容" prop="content" min-width="260" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button size="small" @click="openOrder(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="处方模板" name="prescriptions">
          <div class="template-toolbar">
            <el-button type="primary" @click="openPrescription()">新增处方模板</el-button>
          </div>
          <el-table v-loading="loading" :data="prescriptions" border stripe>
            <el-table-column label="名称" prop="name" min-width="160" />
            <el-table-column label="药品数" width="100">
              <template #default="{ row }">{{ row.items?.length || 0 }}</template>
            </el-table-column>
            <el-table-column label="备注" prop="note" min-width="220" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }"><el-button size="small" @click="openPrescription(row)">编辑</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="recordVisible" title="病历模板" width="560px">
      <el-form label-width="86px">
        <el-form-item label="名称"><el-input v-model="recordForm.name" /></el-form-item>
        <el-form-item label="摘要"><el-input v-model="recordForm.summary" type="textarea" /></el-form-item>
        <el-form-item label="建议"><el-input v-model="recordForm.advice" type="textarea" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="recordForm.isActive" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="diagnosisVisible" title="常用诊断" width="480px">
      <el-form label-width="86px">
        <el-form-item label="编码"><el-input v-model="diagnosisForm.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="diagnosisForm.name" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="diagnosisForm.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diagnosisVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDiagnosis">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderVisible" title="常用医嘱" width="480px">
      <el-form label-width="86px">
        <el-form-item label="类型"><el-input v-model="orderForm.type" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="orderForm.content" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="prescriptionVisible" title="处方模板" width="720px">
      <el-form label-width="86px">
        <el-form-item label="名称"><el-input v-model="prescriptionForm.name" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="prescriptionForm.note" /></el-form-item>
      </el-form>
      <el-table :data="prescriptionForm.items" border>
        <el-table-column label="药品" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.drugId" filterable>
              <el-option v-for="drug in drugs" :key="drug.id" :label="`${drug.name} ${drug.spec}`" :value="drug.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }"><el-input-number v-model="row.quantity" :min="1" /></template>
        </el-table-column>
        <el-table-column label="剂量" width="140">
          <template #default="{ row }"><el-input v-model="row.dosage" /></template>
        </el-table-column>
        <el-table-column label="用法" width="160">
          <template #default="{ row }"><el-input v-model="row.usage" /></template>
        </el-table-column>
      </el-table>
      <div class="template-toolbar">
        <el-button @click="addPrescriptionItem">添加药品</el-button>
      </div>
      <template #footer>
        <el-button @click="prescriptionVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrescription">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  createClinicalTemplateResource,
  fetchAdminResource,
  fetchClinicalTemplateResource,
  updateClinicalTemplateResource,
} from '../api/hospital'

interface TemplateRow {
  id: string
  name?: string
  code?: string
  note?: string
  type?: string
  content?: string
  summary?: string
  advice?: string
  isActive?: boolean
  items?: PrescriptionTemplateItemRow[]
}

interface PrescriptionTemplateItemRow {
  drugId: string
  quantity: number
  dosage: string
  usage: string
}
interface DrugRow {
  id: string
  name: string
  spec: string
}

const loading = ref(false)
const activeTab = ref('records')
const records = ref<TemplateRow[]>([])
const diagnoses = ref<TemplateRow[]>([])
const orders = ref<TemplateRow[]>([])
const prescriptions = ref<TemplateRow[]>([])
const drugs = ref<DrugRow[]>([])

const recordVisible = ref(false)
const diagnosisVisible = ref(false)
const orderVisible = ref(false)
const prescriptionVisible = ref(false)
const editing = ref<{ resource: string; id: string } | null>(null)

const recordForm = reactive({ name: '', summary: '', advice: '', isActive: true })
const diagnosisForm = reactive({ code: '', name: '', note: '', isActive: true })
const orderForm = reactive({ type: '', content: '', isActive: true })
const prescriptionForm = reactive({ name: '', note: '', isActive: true, items: [] as Array<{ drugId: string; quantity: number; dosage: string; usage: string }> })

async function load() {
  loading.value = true
  try {
    const [recordRows, diagnosisRows, orderRows, prescriptionRows, drugPage] = await Promise.all([
      fetchClinicalTemplateResource('medical-record-templates'),
      fetchClinicalTemplateResource('common-diagnoses'),
      fetchClinicalTemplateResource('common-orders'),
      fetchClinicalTemplateResource('prescription-templates'),
      fetchAdminResource('drugs', { pageSize: 500 }),
    ])
    records.value = recordRows as TemplateRow[]
    diagnoses.value = diagnosisRows as TemplateRow[]
    orders.value = orderRows as TemplateRow[]
    prescriptions.value = prescriptionRows as TemplateRow[]
    drugs.value = drugPage.items as DrugRow[]
  } finally {
    loading.value = false
  }
}

function openRecord(row?: TemplateRow) {
  editing.value = row ? { resource: 'medical-record-templates', id: row.id } : null
  Object.assign(recordForm, { name: row?.name ?? '', summary: row?.summary ?? '', advice: row?.advice ?? '', isActive: row?.isActive ?? true })
  recordVisible.value = true
}

function openDiagnosis(row?: TemplateRow) {
  editing.value = row ? { resource: 'common-diagnoses', id: row.id } : null
  Object.assign(diagnosisForm, { code: row?.code ?? '', name: row?.name ?? '', note: row?.note ?? '', isActive: row?.isActive ?? true })
  diagnosisVisible.value = true
}

function openOrder(row?: TemplateRow) {
  editing.value = row ? { resource: 'common-orders', id: row.id } : null
  Object.assign(orderForm, { type: row?.type ?? '', content: row?.content ?? '', isActive: row?.isActive ?? true })
  orderVisible.value = true
}

function openPrescription(row?: TemplateRow) {
  editing.value = row ? { resource: 'prescription-templates', id: row.id } : null
  Object.assign(prescriptionForm, {
    name: row?.name ?? '',
    note: row?.note ?? '',
    isActive: row?.isActive ?? true,
    items: row?.items?.map((item) => ({ drugId: item.drugId, quantity: item.quantity, dosage: item.dosage, usage: item.usage })) ?? [],
  })
  prescriptionVisible.value = true
}

function addPrescriptionItem() {
  prescriptionForm.items.push({ drugId: '', quantity: 1, dosage: '', usage: '' })
}

async function saveResource(resource: string, data: Record<string, unknown>) {
  if (editing.value?.resource === resource) {
    await updateClinicalTemplateResource(resource, editing.value.id, data)
  } else {
    await createClinicalTemplateResource(resource, data)
  }
  await load()
}

async function saveRecord() {
  await saveResource('medical-record-templates', recordForm)
  recordVisible.value = false
}

async function saveDiagnosis() {
  await saveResource('common-diagnoses', diagnosisForm)
  diagnosisVisible.value = false
}

async function saveOrder() {
  await saveResource('common-orders', orderForm)
  orderVisible.value = false
}

async function savePrescription() {
  await saveResource('prescription-templates', prescriptionForm)
  prescriptionVisible.value = false
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.template-toolbar {
  display: flex;
  gap: 10px;
  margin: 0 0 12px;
}
</style>
