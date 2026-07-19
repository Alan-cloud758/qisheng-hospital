<template>
  <main class="login-page">
    <!-- Left branding panel -->
    <aside class="login-brand">
      <div class="brand-particles">
        <span v-for="n in 6" :key="n" class="particle" :class="`particle-${n}`" />
      </div>

      <div class="brand-content">
        <div class="brand-icon-ring">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
              <path d="M12 2v20"/>
            </svg>
          </div>
        </div>

        <h1 class="brand-title">启胜医院</h1>
        <p class="brand-subtitle">QISHENG HOSPITAL</p>
        <div class="brand-divider" />
        <p class="brand-tagline">智慧医疗信息管理平台</p>

        <div class="brand-features">
          <div class="feature-item" v-for="f in features" :key="f.label">
            <div class="feature-icon" :style="{ background: f.bg }">
              <span v-html="f.icon" />
            </div>
            <div>
              <strong>{{ f.label }}</strong>
              <span>{{ f.desc }}</span>
            </div>
          </div>
        </div>

        <div class="brand-stats">
          <div class="stat" v-for="s in stats" :key="s.label">
            <strong>{{ s.value }}</strong>
            <span>{{ s.label }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right login panel -->
    <section class="login-right">
      <div class="login-card">
        <div class="login-card-header">
          <h2>欢迎回来</h2>
          <p>请登录您的账号以继续</p>
        </div>

        <!-- Role tabs -->
        <div class="role-tabs">
          <button
            v-for="tab in roleTabs"
            :key="tab.key"
            :class="['role-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <span v-html="tab.icon" />
            {{ tab.label }}
          </button>
        </div>

        <el-form class="login-form" @submit.prevent="submit">
          <div class="form-field">
            <label>账号</label>
            <el-input
              v-model="username"
              placeholder="请输入登录账号"
              size="large"
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#9ca3af">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </template>
            </el-input>
          </div>

          <div class="form-field">
            <div class="form-field-row">
              <label>密码</label>
              <a class="forgot-link" href="#">忘记密码？</a>
            </div>
            <el-input
              v-model="password"
              placeholder="请输入密码"
              show-password
              size="large"
              type="password"
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#9ca3af">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </template>
            </el-input>
          </div>

          <div class="form-options">
            <el-checkbox v-model="rememberMe" label="记住我" size="small" />
          </div>

          <el-button
            :loading="loading"
            native-type="submit"
            size="large"
            type="primary"
            class="login-btn"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>

          <Transition name="slide-fade">
            <div v-if="error" class="login-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ error }}
            </div>
          </Transition>
        </el-form>

        <!-- Demo accounts -->
        <div class="login-footer">
          <p class="login-footer-title">
            <span class="footer-line" />
            快速体验
            <span class="footer-line" />
          </p>

          <div class="demo-section-label" v-if="activeTab === 'staff'">医务人员</div>
          <div class="demo-section-label" v-else>患者端</div>

          <div class="demo-accounts" v-if="activeTab === 'staff'">
            <div
              v-for="account in staffAccounts"
              :key="account.username"
              class="demo-account"
              @click="fillAccount(account)"
            >
              <div class="demo-account-avatar" :style="{ background: account.gradient }">
                {{ account.icon }}
              </div>
              <div class="demo-account-info">
                <strong>{{ account.label }}</strong>
                <span>{{ account.username }}</span>
              </div>
              <svg class="demo-account-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          <div class="demo-accounts" v-else>
            <div
              v-for="account in patientAccounts"
              :key="account.username"
              class="demo-account"
              @click="fillAccount(account)"
            >
              <div class="demo-account-avatar" :style="{ background: account.gradient }">
                {{ account.icon }}
              </div>
              <div class="demo-account-info">
                <strong>{{ account.label }}</strong>
                <span>{{ account.username }}</span>
              </div>
              <svg class="demo-account-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <p class="login-copyright">
        启胜医院 HIS 系统 &copy; {{ new Date().getFullYear() }} &middot; 仅供演示
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('Qisheng@123')
const loading = ref(false)
const error = ref('')
const rememberMe = ref(true)
const activeTab = ref<'staff' | 'patient'>('staff')

const roleTabs = [
  {
    key: 'staff' as const,
    label: '医务人员',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    key: 'patient' as const,
    label: '患者',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  },
]

const staffAccounts = [
  { username: 'admin', password: 'Qisheng@123', label: '系统管理员', icon: '管', gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)' },
  { username: 'doctor_chen', password: 'Qisheng@123', label: '门诊医生', icon: '医', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
  { username: 'cashier_lin', password: 'Qisheng@123', label: '收费窗口', icon: '费', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  { username: 'pharmacy_wu', password: 'Qisheng@123', label: '药房发药', icon: '药', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { username: 'nurse_qiu', password: 'Qisheng@123', label: '护士站', icon: '护', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  { username: 'lab_tech', password: 'Qisheng@123', label: '检验科', icon: '检', gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
]

const patientAccounts = [
  { username: 'patient_demo', password: 'Qisheng@123', label: '张三（普通门诊）', icon: '张', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { username: 'patient_demo_02', password: 'Qisheng@123', label: '李四（复诊患者）', icon: '李', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
  { username: 'patient_demo_03', password: 'Qisheng@123', label: '王五（预约挂号）', icon: '王', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
]

const features = [
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    label: '全流程覆盖',
    desc: '挂号、就诊、收费、发药一站式',
    bg: 'rgba(13, 148, 136, 0.12)',
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    label: '数据驾驶舱',
    desc: '运营数据实时监控与分析',
    bg: 'rgba(37, 99, 235, 0.12)',
  },
  {
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    label: '安全可靠',
    desc: '角色权限隔离，数据加密传输',
    bg: 'rgba(124, 58, 237, 0.12)',
  },
]

const stats = [
  { value: '120+', label: '数据库模型' },
  { value: '50+', label: '功能页面' },
  { value: '9', label: '角色权限' },
]

function fillAccount(account: { username: string; password: string }) {
  username.value = account.username
  password.value = account.password
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(username.value, password.value)
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch {
    error.value = '账号或密码不正确，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Page layout ── */
.login-page {
  display: flex;
  min-height: 100vh;
  background: #f8fafb;
}

/* ═══════════════════════════════════════════════
   LEFT — Branding Panel
   ═══════════════════════════════════════════════ */
.login-brand {
  position: relative;
  width: 46%;
  min-height: 100vh;
  background: linear-gradient(160deg, #0c1117 0%, #111827 40%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

/* Animated particles */
.brand-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  animation: particleFloat 20s ease-in-out infinite;
}

.particle-1 { width: 300px; height: 300px; background: #14b8a6; top: -80px; left: -60px; animation-delay: 0s; }
.particle-2 { width: 200px; height: 200px; background: #6366f1; bottom: -40px; right: -40px; animation-delay: -5s; }
.particle-3 { width: 150px; height: 150px; background: #2563eb; top: 40%; left: 60%; animation-delay: -10s; }
.particle-4 { width: 100px; height: 100px; background: #14b8a6; top: 20%; right: 20%; animation-delay: -3s; opacity: 0.05; }
.particle-5 { width: 180px; height: 180px; background: #8b5cf6; bottom: 20%; left: 10%; animation-delay: -8s; opacity: 0.06; }
.particle-6 { width: 120px; height: 120px; background: #06b6d4; top: 60%; right: 40%; animation-delay: -12s; opacity: 0.05; }

@keyframes particleFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(40px, 30px) scale(1.05); }
}

/* Grid overlay */
.login-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* Top-right glow */
.login-brand::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  pointer-events: none;
}

.brand-content {
  position: relative;
  z-index: 1;
  padding: var(--space-10);
  max-width: 480px;
  animation: brandFadeIn 1s ease-out;
}

@keyframes brandFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Brand icon */
.brand-icon-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(99, 102, 241, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  position: relative;
}

.brand-icon-ring::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(99, 102, 241, 0.3));
  z-index: -1;
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

.brand-icon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #0d9488, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-icon svg {
  width: 26px;
  height: 26px;
  color: white;
}

.brand-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.04em;
  line-height: 1.1;
}

.brand-subtitle {
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2em;
  font-weight: 500;
}

.brand-divider {
  width: 48px;
  height: 3px;
  background: linear-gradient(90deg, #14b8a6, #6366f1);
  border-radius: 2px;
  margin: var(--space-6) 0;
}

.brand-tagline {
  margin: 0 0 var(--space-8);
  font-size: var(--text-lg);
  color: rgba(255, 255, 255, 0.7);
  line-height: var(--leading-relaxed);
}

/* Features */
.brand-features {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.feature-item strong {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
}

.feature-item span {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.45);
}

/* Stats */
.brand-stats {
  display: flex;
  gap: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.stat strong {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 800;
  background: linear-gradient(135deg, #14b8a6, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.stat span {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.4);
}

/* ═══════════════════════════════════════════════
   RIGHT — Login Panel
   ═══════════════════════════════════════════════ */
.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  position: relative;
  overflow-y: auto;
}

.login-card {
  width: 100%;
  max-width: 440px;
  animation: cardSlideIn 0.6s ease-out;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.login-card-header {
  margin-bottom: var(--space-6);
}

.login-card-header h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.login-card-header p {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* Role tabs */
.role-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  background: var(--color-surface-muted);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: inherit;
}

.role-tab:hover {
  color: var(--color-text-primary);
}

.role-tab.active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Form */
.login-form {
  display: grid;
  gap: var(--space-4);
}

.form-field label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forgot-link {
  font-size: var(--text-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: calc(var(--space-1) * -1);
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: var(--text-base);
  font-weight: 600;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  border: none;
  letter-spacing: 0.05em;
  transition: all var(--transition-fast);
}

.login-btn:hover {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.35);
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

.login-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-danger-bg);
  border: 1px solid rgba(220, 38, 38, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: var(--text-sm);
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Demo accounts ── */
.login-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}

.login-footer-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-align: center;
  justify-content: center;
}

.footer-line {
  display: block;
  width: 40px;
  height: 1px;
  background: var(--color-border);
}

.demo-section-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
  padding-left: 2px;
}

.demo-accounts {
  display: grid;
  gap: var(--space-2);
}

.demo-account {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-account:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.08);
}

.demo-account:hover .demo-account-arrow {
  opacity: 1;
  transform: translateX(0);
}

.demo-account-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  color: white;
  font-size: var(--text-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.demo-account-info {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.demo-account-info strong {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.demo-account-info span {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.demo-account-arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition: all var(--transition-fast);
  color: var(--color-primary);
  flex-shrink: 0;
}

/* Copyright */
.login-copyright {
  margin-top: var(--space-6);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .login-brand {
    display: none;
  }

  .login-page {
    justify-content: center;
  }

  .login-right {
    max-width: 480px;
  }
}

@media (max-width: 480px) {
  .login-right {
    padding: var(--space-5);
  }

  .login-card-header h2 {
    font-size: var(--text-xl);
  }
}
</style>
