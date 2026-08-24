<template>
  <table>
    <thead>
      <tr>
        <th v-for="header in headers" :key="header">{{ header }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in rows" :key="index">
        <td v-for="header in headers" :key="header">{{ row[header] ?? '-' }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true }
});
</script>

<style scoped>
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
thead { background: #f5f5f5; }
</style>
