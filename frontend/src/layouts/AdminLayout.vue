<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <strong>启胜医院</strong>
        <span>门诊运营平台</span>
      </div>
      <nav class="nav">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">{{ item.label }}</RouterLink>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <strong>{{ authStore.user?.displayName || '医院工作人员' }}</strong>
          <span>{{ authStore.user?.roles?.join(' / ') || '未登录' }}</span>
        </div>
        <el-button @click="logout">退出</el-button>
      </header>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { path: '/', label: '运营总览' },
  { path: '/accounts', label: '账号角色' },
  { path: '/departments', label: '科室管理' },
  { path: '/doctors', label: '医生档案' },
  { path: '/patients', label: '患者中心' },
  { path: '/schedules', label: '排班管理' },
  { path: '/registrations', label: '预约签到' },
  { path: '/doctor', label: '医生工作台' },
  { path: '/cashier', label: '收费工作台' },
  { path: '/pharmacy', label: '药房工作台' },
  { path: '/drugs', label: '药品目录' },
  { path: '/drug-stock', label: '药品库存' },
  { path: '/drug-stock-movements', label: '库存流水' },
  { path: '/announcements', label: '公告配置' },
  { path: '/dictionaries', label: '数据字典' },
  { path: '/audit', label: '审计日志' },
]

function logout() {
  authStore.logout()
  void router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid rgba(172, 189, 184, 0.45);
  background:
    radial-gradient(circle at 20% 0%, rgba(70, 178, 154, 0.22), transparent 32%),
    linear-gradient(180deg, #112821 0%, #0c1916 100%);
  color: #eef8f4;
  padding: 22px 16px;
}

.brand {
  display: grid;
  gap: 4px;
  margin-bottom: 24px;
  padding: 0 8px;
}

.brand strong {
  font-size: 22px;
}

.brand span {
  color: #a9c5bb;
  font-size: 13px;
}

.nav {
  display: grid;
  gap: 5px;
}

.nav a {
  border-radius: 12px;
  color: #d7e6df;
  padding: 10px 12px;
}

.nav a.router-link-active {
  background: #1f7a68;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.main {
  min-width: 0;
  padding: 22px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.topbar div {
  display: grid;
  gap: 3px;
}

.topbar span {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
}
</style>
