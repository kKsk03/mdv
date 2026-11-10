<script setup lang="ts">
// A row selection indicator, never a second focusable control inside a button or option.
// Independent input actions use the public Checkbox / Radio / Switch in an action slot.
defineProps<{ kind: 'checkbox' | 'radio' | 'switch'; checked: boolean }>()
</script>

<template>
  <span
    class="mdv-list-item__control"
    :class="['mdv-list-item__control--' + kind, { 'mdv-list-item__control--on': checked }]"
    aria-hidden="true"
  >
    <span class="mdv-list-item__control-mark" />
  </span>
</template>
