<template>
  <main class="login-page">
    <section class="login-panel">
      <div>
        <p class="eyebrow">QISHENG HOSPITAL</p>
        <h1>启胜医院管理端</h1>
        <p>统一管理科室、医生排班、预约挂号、门诊接诊、收费与药房发药流程。</p>
        <ul>
          <li>管理员：admin / Qisheng@123</li>
          <li>医生：doctor_chen / Qisheng@123</li>
          <li>收费员：cashier_lin / Qisheng@123</li>
          <li>药房：pharmacy_wu / Qisheng@123</li>
        </ul>
      </div>

      <el-form class="login-form" @submit.prevent="submit">
        <el-form-item>
          <el-input v-model="username" placeholder="账号" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" placeholder="密码" show-password size="large" type="password" />
        </el-form-item>
        <el-button :loading="loading" native-type="submit" size="large" type="primary">登录</el-button>
        <p v-if="error" class="error">{{ error }}</p>
      </el-form>
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

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(username.value, password.value)
    await router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch {
    error.value = '账号或密码不正确'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 15% 20%, rgba(31, 122, 104, 0.18), transparent 30%),
    linear-gradient(135deg, #eef7f2 0%, #dbece6 48%, #f7faf9 100%);
}

.login-panel {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  width: min(920px, 100%);
  border: 1px solid #cbded8;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 80px rgba(17, 40, 33, 0.14);
  padding: 36px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

h1 {
  margin: 0;
  color: #112821;
  font-size: 34px;
}

p,
li {
  color: #64748b;
  line-height: 1.7;
}

.login-form {
  display: grid;
  align-content: center;
}

.error {
  margin: 10px 0 0;
  color: #b91c1c;
}

@media (max-width: 760px) {
  .login-panel {
    grid-template-columns: 1fr;
  }
}
</style>
