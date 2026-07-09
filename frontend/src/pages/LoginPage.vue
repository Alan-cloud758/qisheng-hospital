<template>
  <main class="login-page">
    <section class="login-panel">
      <div>
        <p class="eyebrow">QISHENG HOSPITAL</p>
        <h1>启胜医院管理端</h1>
        <p>统一管理科室、医生排班、预约挂号、门诊与收费工作台。</p>
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
  background: linear-gradient(135deg, #eef7f2 0%, #dbece6 48%, #f7faf9 100%);
}

.login-panel {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  width: min(880px, 100%);
  border: 1px solid #cbded8;
  border-radius: 8px;
  background: #ffffff;
  padding: 34px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: 32px;
}

p {
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

@media (max-width: 720px) {
  .login-panel {
    grid-template-columns: 1fr;
  }
}
</style>
