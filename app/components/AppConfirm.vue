<template>
  <ConfirmModal
    :is-open="store.isOpen"
    :title="store.title"
    :confirm-text="store.confirmText"
    :variant="store.variant"
    @close="store.cancel"
    @confirm="store.confirm"
  >
    <div v-html="store.message"></div>
  </ConfirmModal>
</template>

<script setup>
import { useConfirmStore } from '~/stores/confirm'
const store = useConfirmStore()
</script>