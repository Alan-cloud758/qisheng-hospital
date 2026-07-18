<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">System Config</p>
        <h1 class="page-title">系统配置</h1>
        <p class="page-subtitle">管理系统参数、通知模板和数据导入日志。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadTab">
      <!-- 系统参数 -->
      <el-tab-pane label="系统参数" name="params">
        <div class="toolbar">
          <el-input v-model="paramSearch" placeholder="搜索参数..." clearable style="width:240px" />
          <el-button type="primary" @click="paramVisible=true">新增参数</el-button>
        </div>
        <el-table :data="filteredParams" border stripe v-loading="loading">
          <el-table-column label="参数键" prop="key" min-width="200" />
          <el-table-column label="值" min-width="200">
            <template #default="{ row }">
              <el-input v-if="row._editing" v-model="row._editValue" size="small" />
              <span v-else>{{ row.value }}</span>
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="description" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="row._editing">
                <el-button size="small" type="primary" @click="saveParam(row)">保存</el-button>
                <el-button size="small" @click="row._editing=false">取消</el-button>
              </template>
              <el-button v-else size="small" @click="startEditParam(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 通知模板 -->
      <el-tab-pane label="通知模板" name="templates">
        <div class="toolbar"><el-button type="primary" @click="templateVisible=true">新增模板</el-button></div>
        <el-table :data="templates" border stripe v-loading="loading">
          <el-table-column label="模板编码" prop="code" width="160" />
          <el-table-column label="名称" prop="name" width="150" />
          <el-table-column label="渠道" width="90"><template #default="{ row }"><el-tag size="small">{{ row.channel }}</el-tag></template></el-table-column>
          <el-table-column label="标题模板" prop="titleTemplate" show-overflow-tooltip />
          <el-table-column label="内容模板" prop="bodyTemplate" show-overflow-tooltip />
          <el-table-column label="状态" width="80"><template #default="{ row }"><el-tag :type="row.isActive?'success':'info'" size="small">{{ row.isActive?'启用':'停用' }}</el-tag></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 数据导入日志 -->
      <el-tab-pane label="数据导入日志" name="import-logs">
        <el-table :data="importLogs" border stripe v-loading="loading">
          <el-table-column label="导入类型" prop="importType" width="140" />
          <el-table-column label="文件名" prop="fileName" min-width="200" show-overflow-tooltip />
          <el-table-column label="总行数" prop="totalRows" width="90" />
          <el-table-column label="成功" prop="successRows" width="70" />
          <el-table-column label="失败" prop="failedRows" width="70" />
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status==='SUCCESS'?'success':row.status==='FAILED'?'danger':'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="操作时间" width="150"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增参数 -->
    <el-dialog v-model="paramVisible" title="新增系统参数" width="480px">
      <el-form label-width="86px">
        <el-form-item label="参数键"><el-input v-model="paramForm.key" /></el-form-item>
        <el-form-item label="值"><el-input v-model="paramForm.value" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="paramForm.description" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="paramVisible=false">取消</el-button><el-button type="primary" @click="createParam">保存</el-button></template>
    </el-dialog>

    <!-- 新增模板 -->
    <el-dialog v-model="templateVisible" title="新增通知模板" width="520px">
      <el-form label-width="86px">
        <el-form-item label="编码"><el-input v-model="templateForm.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="templateForm.name" /></el-form-item>
        <el-form-item label="渠道"><el-select v-model="templateForm.channel"><el-option label="短信" value="SMS" /><el-option label="邮件" value="EMAIL" /><el-option label="站内" value="IN_APP" /></el-select></el-form-item>
        <el-form-item label="标题模板"><el-input v-model="templateForm.titleTemplate" /></el-form-item>
        <el-form-item label="内容模板"><el-input v-model="templateForm.bodyTemplate" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="templateVisible=false">取消</el-button><el-button type="primary" @click="createTemplate">保存</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { apiClient } from '../api/client'

const activeTab = ref('params')
const loading = ref(false)
const fmt = (v?: string) => v ? v.replace('T', ' ').slice(0, 16) : '-'

// 系统参数
const params = ref<Array<Record<string, unknown>>>([])
const paramSearch = ref('')
const paramVisible = ref(false)
const paramForm = reactive({ key: '', value: '', description: '' })

const filteredParams = computed(() => {
  const q = paramSearch.value.toLowerCase()
  return params.value.filter(p => !q || (p.key as string).toLowerCase().includes(q) || ((p.description as string) || '').toLowerCase().includes(q))
})

function startEditParam(row: Record<string, unknown>) { row._editing = true; row._editValue = row.value }
async function saveParam(row: Record<string, unknown>) {
  await apiClient.put(`/admin/system-config/${row.key}`, { value: row._editValue })
  row.value = row._editValue; row._editing = false
}
async function createParam() {
  await apiClient.post('/admin/system-config', { ...paramForm }); paramVisible.value = false; await loadParams()
}

// 通知模板
const templates = ref<Record<string, unknown>[]>([])
const templateVisible = ref(false)
const templateForm = reactive({ code: '', name: '', channel: 'SMS', titleTemplate: '', bodyTemplate: '' })
async function createTemplate() {
  await apiClient.post('/admin/notification-templates', { ...templateForm }); templateVisible.value = false; await loadTemplates()
}

// 导入日志
const importLogs = ref<Record<string, unknown>[]>([])

async function loadParams() { const { data } = await apiClient.get('/admin/system-config'); params.value = (data.items || []).map((r: Record<string, unknown>) => ({ ...r, _editing: false, _editValue: '' })) }
async function loadTemplates() { const { data } = await apiClient.get('/admin/notification-templates'); templates.value = data.items || [] }
async function loadImportLogs() { const { data } = await apiClient.get('/admin/import-logs'); importLogs.value = data.items || [] }

async function loadTab() {
  loading.value = true
  try {
    if (activeTab.value === 'params') await loadParams()
    else if (activeTab.value === 'templates') await loadTemplates()
    else if (activeTab.value === 'import-logs') await loadImportLogs()
  } finally { loading.value = false }
}

onMounted(() => { void loadTab() })
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
</style>
