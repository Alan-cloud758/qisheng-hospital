<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <strong>启胜医院</strong>
        <span>医疗平台</span>
      </div>
      <nav class="nav">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">{{ item.label }}</RouterLink>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>
          <strong>{{ authStore.user?.displayName || '医院工作人员' }}</strong>
          <span>当前工作台</span>
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
  { path: '/', label: '平台总览' },
  { path: '/departments', label: '医院组织' },
  { path: '/schedules', label: '排班挂号' },
  { path: '/registrations', label: '预约列表' },
  { path: '/doctor', label: '门诊工作台' },
  { path: '/cashier', label: '收费工作台' },
]

function logout() {
  authStore.logout()
  void router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #d8e4df;
  background: #10231f;
  color: #eef8f4;
  padding: 20px 14px;
}

.brand {
  display: grid;
  gap: 4px;
  margin-bottom: 24px;
}

.brand strong {
  font-size: 20px;
}

.brand span {
  color: #9fb8af;
  font-size: 13px;
}

.nav {
  display: grid;
  gap: 6px;
}

.nav a {
  border-radius: 8px;
  color: #d7e6df;
  padding: 10px 12px;
}

.nav a.router-link-active {
  background: #1f6f63;
  color: #ffffff;
}

.main {
  min-width: 0;
  padding: 20px;
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

@media (max-width: 760px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>
