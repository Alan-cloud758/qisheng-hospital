<script setup lang="ts">
import { onMounted } from 'vue'
import { usePatientStore } from '../../stores/patient'

const store = usePatientStore()

function setDefault(id: string) {
  void store.setDefaultMember(id)
}

onMounted(() => {
  void store.loadMembers()
})
</script>

<template>
  <view class="page">
    <view class="panel">
      <text class="title">就诊人</text>
      <text class="muted">管理本人和家属就诊档案。</text>
    </view>

    <view v-for="member in store.visitMembers" :key="member.id" class="panel">
      <text class="name">{{ member.name }} <text v-if="member.isDefault" class="tag">默认</text></text>
      <text class="muted">{{ member.relationship }} / {{ member.phone || '未填写电话' }}</text>
      <button v-if="!member.isDefault" class="plain" @tap="setDefault(member.id)">设为默认</button>
    </view>
  </view>
</template>

<style scoped>
.title,
.name {
  display: block;
  font-weight: 700;
}

.title {
  font-size: 38rpx;
}

.name {
  font-size: 32rpx;
}

.tag {
  color: #126c5b;
  font-size: 24rpx;
}
</style>
