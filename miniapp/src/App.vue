<script setup lang="ts">
</script>

<template>
  <slot />
</template>

<style>
page {
  background: #f4f7f6;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
}

.panel {
  background: #ffffff;
  border: 1rpx solid #dce7e4;
  border-radius: 12rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.muted {
  color: #6b7280;
}
</style>
