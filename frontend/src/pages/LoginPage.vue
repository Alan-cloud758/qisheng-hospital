<template>
  <main class="login-page">
    <div class="login-bg">
      <div class="login-bg-shape login-bg-shape-1"></div>
      <div class="login-bg-shape login-bg-shape-2"></div>
      <div class="login-bg-shape login-bg-shape-3"></div>
    </div>

    <section class="login-container">
      <div class="login-card">
        <div class="login-card-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1>启胜医院</h1>
          <p class="login-subtitle">门诊运营管理平台</p>
        </div>

        <el-form class="login-form" @submit.prevent="submit">
          <div class="form-field">
            <label>账号</label>
            <el-input
              v-model="username"
              placeholder="请输入登录账号"
              size="large"
              prefix-icon=""
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#9ca3af">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </template>
            </el-input>
          </div>

          <div class="form-field">
            <label>密码</label>
            <el-input
              v-model="password"
              placeholder="请输入密码"
              show-password
              size="large"
              type="password"
            >
              <template #prefix>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:#9ca3af">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </template>
            </el-input>
          </div>

          <el-button
            :loading="loading"
            native-type="submit"
            size="large"
            type="primary"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>

          <Transition name="fade">
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

        <div class="login-footer">
          <p class="login-footer-title">演示账号</p>
          <div class="demo-accounts">
            <div
              v-for="account in demoAccounts"
              :key="account.username"
              class="demo-account"
              @click="fillAccount(account)"
            >
              <div class="demo-account-avatar" :style="{ background: account.color }">
                {{ account.label[0] }}
              </div>
              <div class="demo-account-info">
                <strong>{{ account.label }}</strong>
                <span>{{ account.username }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="login-copyright">
        启胜医院 HIS 系统 &copy; {{ new Date().getFullYear() }}
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

const demoAccounts = [
  { username: 'admin', password: 'Qisheng@123', label: '管理员', color: '#0d9488' },
  { username: 'doctor_chen', password: 'Qisheng@123', label: '医生', color: '#2563eb' },
  { username: 'cashier_lin', password: 'Qisheng@123', label: '收费员', color: '#d97706' },
  { username: 'pharmacy_wu', password: 'Qisheng@123', label: '药房', color: '#7c3aed' },
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
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 30%, #f0f9ff 70%, #f5f3ff 100%);
}

/* ── Background decoration ── */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.login-bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.login-bg-shape-1 {
  width: 600px;
  height: 600px;
  background: rgba(13, 148, 136, 0.15);
  top: -200px;
  right: -100px;
}

.login-bg-shape-2 {
  width: 400px;
  height: 400px;
  background: rgba(37, 99, 235, 0.1);
  bottom: -100px;
  left: -50px;
}

.login-bg-shape-3 {
  width: 300px;
  height: 300px;
  background: rgba(124, 58, 237, 0.08);
  top: 50%;
  left: 60%;
}

/* ── Card ── */
.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-2xl);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.02);
  padding: var(--space-8) var(--space-8) var(--space-6);
}

/* ── Header ── */
.login-card-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--space-4);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}

.login-logo svg {
  width: 28px;
  height: 28px;
  color: white;
}

.login-card-header h1 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

/* ── Form ── */
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

.login-btn {
  width: 100%;
  height: 44px;
  font-size: var(--text-base);
  font-weight: 600;
  margin-top: var(--space-2);
  border-radius: var(--radius-md);
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Demo accounts ── */
.login-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.login-footer-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
}

.demo-accounts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.demo-account {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-account:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: var(--shadow-xs);
}

.demo-account-avatar {
  width: 32px;
  height: 32px;
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

/* ── Copyright ── */
.login-copyright {
  margin-top: var(--space-5);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .login-card {
    padding: var(--space-6) var(--space-5) var(--space-5);
  }

  .demo-accounts {
    grid-template-columns: 1fr;
  }
}
</style>
