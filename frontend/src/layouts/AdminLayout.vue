<template>
  <div class="admin-layout" :class="{ collapsed: sidebarCollapsed }">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div v-show="!sidebarCollapsed" class="brand-text">
            <strong>启胜医院</strong>
            <span>门诊运营平台</span>
          </div>
        </div>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开菜单' : '收起菜单'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline v-if="sidebarCollapsed" points="9 18 15 12 9 6"/>
            <polyline v-else points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      <nav class="nav-scroll">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div v-show="!sidebarCollapsed" class="nav-group-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :title="sidebarCollapsed ? item.label : undefined"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span v-show="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="topbar-right">
          <div class="user-info">
            <div class="user-avatar">
              {{ (authStore.user?.displayName || '工')[0] }}
            </div>
            <div v-show="true" class="user-meta">
              <strong>{{ authStore.user?.displayName || '医院工作人员' }}</strong>
              <span>{{ authStore.user?.roles?.join(' / ') || '未登录' }}</span>
            </div>
          </div>
          <el-button size="small" @click="logout" plain>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right:4px;vertical-align:middle;">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            退出
          </el-button>
        </div>
      </header>

      <div class="main-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const sidebarCollapsed = ref(false)

const ICONS = {
  dashboard:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  users:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  shield:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  menu:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  building:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01"/></svg>',
  stethoscope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
  calendar:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  clipboard:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  doctor:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v4M10 13h4"/></svg>',
  bed:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>',
  fileText:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  dollar:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  heart:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  flask:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v5.343l5.657 8.486A2 2 0 0 1 18.928 20H5.072a2 2 0 0 1-1.729-3.17L9 8.343V3z"/><path d="M9 3h6"/></svg>',
  scan:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7V2h5M17 2h5v5M22 17v5h-5M7 22H2v-5"/><circle cx="12" cy="12" r="3"/></svg>',
  pill:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/></svg>',
  box:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  speaker:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  book:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  log:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
}

const navGroups = [
  {
    label: '概览',
    items: [
      { path: '/', label: '运营总览', icon: ICONS.dashboard },
    ],
  },
  {
    label: '门诊管理',
    items: [
      { path: '/accounts', label: '账号角色', icon: ICONS.users },
      { path: '/departments', label: '科室管理', icon: ICONS.building },
      { path: '/doctors', label: '医生档案', icon: ICONS.doctor },
      { path: '/patients', label: '患者中心', icon: ICONS.heart },
      { path: '/schedules', label: '排班管理', icon: ICONS.calendar },
      { path: '/registrations', label: '预约签到', icon: ICONS.clipboard },
      { path: '/doctor', label: '医生工作台', icon: ICONS.stethoscope },
      { path: '/clinical-templates', label: '临床模板', icon: ICONS.fileText },
      { path: '/cashier', label: '收费工作台', icon: ICONS.dollar },
    ],
  },
  {
    label: '住院管理',
    items: [
      { path: '/inpatient-admissions', label: '入出院管理', icon: ICONS.clipboard },
      { path: '/beds', label: '病区床位', icon: ICONS.bed },
      { path: '/inpatient-detail', label: '住院患者', icon: ICONS.heart },
    ],
  },
  {
    label: '检验影像',
    items: [
      { path: '/lab-items', label: '检验项目', icon: ICONS.flask },
      { path: '/lab', label: '检验工作台', icon: ICONS.flask },
      { path: '/imaging-items', label: '影像项目', icon: ICONS.scan },
      { path: '/radiology', label: '影像工作台', icon: ICONS.scan },
    ],
  },
  {
    label: '药房管理',
    items: [
      { path: '/pharmacy', label: '药房工作台', icon: ICONS.pill },
      { path: '/drugs', label: '药品目录', icon: ICONS.pill },
      { path: '/drug-stock', label: '药品库存', icon: ICONS.box },
      { path: '/drug-stock-movements', label: '库存流水', icon: ICONS.box },
    ],
  },
  {
    label: '医保结算',
    items: [
      { path: '/insurance-profiles', label: '医保档案', icon: ICONS.shield },
      { path: '/insurance-mappings', label: '医保目录', icon: ICONS.shield },
      { path: '/insurance-settlements', label: '医保结算', icon: ICONS.dollar },
      { path: '/insurance-logs', label: '医保日志', icon: ICONS.log },
    ],
  },
  {
    label: '系统设置',
    items: [
      { path: '/announcements', label: '公告配置', icon: ICONS.speaker },
      { path: '/dictionaries', label: '数据字典', icon: ICONS.book },
      { path: '/audit', label: '审计日志', icon: ICONS.log },
    ],
  },
  {
    label: '体检管理',
    items: [
      { path: '/exam-packages', label: '体检套餐', icon: ICONS.clipboard },
      { path: '/exam-workbench', label: '体检工作站', icon: ICONS.stethoscope },
    ],
  },
  {
    label: '手术管理',
    items: [
      { path: '/surgery', label: '手术工作台', icon: ICONS.flask },
    ],
  },
  {
    label: '护理管理',
    items: [
      { path: '/nursing', label: '护理工作站', icon: ICONS.heart },
    ],
  },
  {
    label: '物资耗材',
    items: [
      { path: '/consumables', label: '耗材管理', icon: ICONS.box },
    ],
  },
  {
    label: '运营分析',
    items: [
      { path: '/analytics', label: '运营报表', icon: ICONS.dashboard },
    ],
  },
]

function logout() {
  authStore.logout()
  void router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns var(--transition-slow);
}

.admin-layout.collapsed {
  grid-template-columns: var(--sidebar-collapsed) minmax(0, 1fr);
}


/* ── Sidebar ── */

.sidebar {
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  z-index: 100;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 60px;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-icon svg {
  width: 18px;
  height: 18px;
  color: white;
}

.brand-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.brand-text strong {
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.brand-text span {
  font-size: var(--text-xs);
  color: var(--sidebar-text-muted);
  white-space: nowrap;
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--sidebar-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--sidebar-text);
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
}


/* ── Nav ── */

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3) var(--space-2);
}

.nav-scroll::-webkit-scrollbar {
  width: 4px;
}

.nav-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.nav-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.nav-group {
  margin-bottom: var(--space-2);
}

.nav-group-label {
  padding: var(--space-2) var(--space-3) var(--space-1);
  font-size: 11px;
  font-weight: 600;
  color: var(--sidebar-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  color: var(--sidebar-text-muted);
  font-size: var(--text-sm);
  font-weight: 450;
  transition: all var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text);
}

.nav-item.router-link-active,
.nav-item.router-link-exact-active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.nav-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* ── Main Area ── */

.main-area {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-page-bg);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 56px;
}

.topbar-left {
  display: flex;
  align-items: center;
}

.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary-bg), var(--color-primary));
  color: white;
  font-size: var(--text-sm);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-meta {
  display: grid;
  gap: 1px;
}

.user-meta strong {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.user-meta span {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.main-content {
  padding: var(--space-6);
  flex: 1;
}


/* ── Responsive ── */

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--sidebar-width);
    transform: translateX(-100%);
    transition: transform var(--transition-slow);
  }

  .admin-layout:not(.collapsed) .sidebar {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }

  .admin-layout.collapsed .sidebar {
    transform: translateX(-100%);
  }

  .mobile-menu-btn {
    display: flex;
  }
}
</style>
