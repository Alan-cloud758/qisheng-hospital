<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Cashier Desk</p>
        <h1 class="page-title">收费工作台</h1>
        <p class="page-subtitle">处理挂号、诊查和处方产生的待支付订单。</p>
      </div>
      <div class="cashier-actions">
        <el-radio-group v-model="statusTab" @change="load">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="PENDING">待支付</el-radio-button>
          <el-radio-button label="PAID">已支付</el-radio-button>
          <el-radio-button label="CANCELLED">已取消</el-radio-button>
          <el-radio-button label="REFUNDED">已退款</el-radio-button>
        </el-radio-group>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="filteredRows" border stripe>
        <el-table-column label="订单号" prop="orderNo" min-width="160" />
        <el-table-column label="标题" prop="title" min-width="220" />
        <el-table-column label="金额" prop="amount" width="100" />
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="交易" min-width="160">
          <template #default="{ row }">
            {{ row.transactions?.length || 0 }} 笔 / 退款 {{ row.refundOrders?.length || 0 }} 笔
          </template>
        </el-table-column>
        <el-table-column label="医保" width="150">
          <template #default="{ row }">
            {{ latestInsurance(row)?.status || '未结算' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="460">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <el-button size="small" :disabled="row.status !== 'PENDING'" @click="insurancePre(row.id)">预结算</el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'PENDING'" @click="insuranceSettle(row.id)">医保结算</el-button>
            <el-button size="small" type="danger" :disabled="!canReverseInsurance(row)" @click="insuranceReverse(row)">冲正</el-button>
            <el-button size="small" type="primary" :disabled="!canPay(row)" @click="pay(row.id)">模拟收费</el-button>
            <el-button size="small" :disabled="row.status !== 'PENDING'" @click="cancel(row.id)">取消</el-button>
            <el-button size="small" type="warning" :disabled="row.status !== 'PAID'" @click="openRefund(row)">退款</el-button>
            <el-button v-if="hasRequestedRefund(row)" size="small" type="danger" @click="execute(firstRequestedRefundId(row))">
              执行退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="refundVisible" title="退款申请" width="420px">
      <el-form label-width="80px">
        <el-form-item label="金额">
          <el-input-number v-model="refundForm.amount" :min="0" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="refundForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRefund">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="订单详情" size="520px">
      <section v-if="selectedOrder" class="detail-stack">
        <div>
          <h3>{{ selectedOrder.title }}</h3>
          <p>订单号：{{ selectedOrder.orderNo }}</p>
          <p>状态：{{ selectedOrder.status }}</p>
          <p>金额：{{ selectedOrder.amount }}</p>
        </div>

        <div>
          <h4>费用明细</h4>
          <el-table :data="selectedOrder.items || []" border>
            <el-table-column label="项目" prop="itemName" />
            <el-table-column label="数量" prop="quantity" width="80" />
            <el-table-column label="金额" prop="amount" width="100" />
          </el-table>
        </div>

        <div>
          <h4>支付交易</h4>
          <el-table :data="selectedOrder.transactions || []" border>
            <el-table-column label="流水号" prop="transactionNo" min-width="180" />
            <el-table-column label="方式" prop="payMethod" width="110" />
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="金额" prop="amount" width="100" />
          </el-table>
        </div>

        <div>
          <h4>医保拆分</h4>
          <el-table :data="selectedOrder.insuranceSettlements || []" border>
            <el-table-column label="结算号" prop="settlementNo" min-width="170" />
            <el-table-column label="状态" prop="status" width="110" />
            <el-table-column label="医保支付" prop="insuranceAmount" width="110" />
            <el-table-column label="自费" prop="selfPayAmount" width="100" />
          </el-table>
        </div>

        <div>
          <h4>医保明细</h4>
          <el-table :data="latestInsurance(selectedOrder)?.items || []" border>
            <el-table-column label="项目" prop="itemName" />
            <el-table-column label="类别" prop="category" width="80" />
            <el-table-column label="医保支付" prop="insuranceAmount" width="110" />
            <el-table-column label="自费" prop="selfPayAmount" width="100" />
          </el-table>
        </div>

        <div>
          <h4>退款记录</h4>
          <el-table :data="selectedOrder.refundOrders || []" border>
            <el-table-column label="退款号" prop="refundNo" min-width="170" />
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="金额" prop="amount" width="100" />
            <el-table-column label="原因" prop="reason" min-width="160" />
          </el-table>
        </div>
      </section>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  cancelPaymentOrder,
  executePaymentRefund,
  fetchPaymentOrders,
  payOrder,
  preSettleInsurance,
  requestPaymentRefund,
  reverseInsuranceSettlement,
  settleInsurance,
} from '../api/hospital'

interface PaymentOrderRow {
  id: string
  orderNo: string
  title: string
  amount: string | number
  status: string
  items?: Array<{ itemName?: string; quantity?: number; amount?: string | number }>
  transactions?: Array<{ transactionNo?: string; payMethod?: string; status?: string; amount?: string | number }>
  refundOrders?: Array<{ id: string; refundNo?: string; status: string; amount?: string | number; reason?: string }>
  insuranceSettlements?: Array<{
    id: string
    settlementNo: string
    status: string
    insuranceAmount: string | number
    selfPayAmount: string | number
    items?: Array<{ itemName: string; category: string; insuranceAmount: string | number; selfPayAmount: string | number }>
  }>
}

const loading = ref(false)
const rows = ref<PaymentOrderRow[]>([])
const statusTab = ref('')
const refundVisible = ref(false)
const detailVisible = ref(false)
const refundOrderId = ref('')
const selectedOrder = ref<PaymentOrderRow | null>(null)
const refundForm = reactive({ amount: 0, reason: '患者申请退费' })
const filteredRows = computed(() => (statusTab.value ? rows.value.filter((row) => row.status === statusTab.value) : rows.value))

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchPaymentOrders()) as PaymentOrderRow[]
  } finally {
    loading.value = false
  }
}

async function pay(id: string) {
  await payOrder(id)
  await load()
}

async function cancel(id: string) {
  await cancelPaymentOrder(id)
  await load()
}

function openRefund(row: PaymentOrderRow) {
  refundOrderId.value = row.id
  refundForm.amount = Number(row.amount)
  refundForm.reason = '患者申请退费'
  refundVisible.value = true
}

function openDetail(row: PaymentOrderRow) {
  selectedOrder.value = row
  detailVisible.value = true
}

async function submitRefund() {
  await requestPaymentRefund(refundOrderId.value, { amount: refundForm.amount, reason: refundForm.reason })
  refundVisible.value = false
  await load()
}

function hasRequestedRefund(row: PaymentOrderRow) {
  return Boolean(row.refundOrders?.some((item) => item.status === 'REQUESTED'))
}

function firstRequestedRefundId(row: PaymentOrderRow) {
  return row.refundOrders?.find((item) => item.status === 'REQUESTED')?.id ?? ''
}

function latestInsurance(row: PaymentOrderRow | null) {
  return row?.insuranceSettlements?.[0]
}

function canReverseInsurance(row: PaymentOrderRow) {
  return row.status === 'PENDING' && latestInsurance(row)?.status === 'SETTLED'
}

function hasActivePreSettlement(row: PaymentOrderRow) {
  return row.insuranceSettlements?.some((item) => item.status === 'PRE_SETTLED') ?? false
}

function canPay(row: PaymentOrderRow) {
  return row.status === 'PENDING' && !hasActivePreSettlement(row)
}

async function execute(id: string) {
  await executePaymentRefund(id)
  await load()
}

async function insurancePre(id: string) {
  await preSettleInsurance(id)
  await load()
}

async function insuranceSettle(id: string) {
  await settleInsurance(id)
  await load()
}

async function insuranceReverse(row: PaymentOrderRow) {
  const settlement = latestInsurance(row)
  if (!settlement) return
  await reverseInsuranceSettlement(settlement.id)
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.cashier-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.detail-stack {
  display: grid;
  gap: 20px;
}

.detail-stack h3,
.detail-stack h4 {
  margin: 0 0 10px;
}
</style>
