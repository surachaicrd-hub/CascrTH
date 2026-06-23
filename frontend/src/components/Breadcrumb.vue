<script setup>
defineProps({
  items: {
    type: Array,
    required: true
    // Each item: { label: string, to?: string }
  }
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="mb-6">
    <ol class="flex items-center flex-wrap gap-1 text-sm" itemscope itemtype="https://schema.org/BreadcrumbList">
      <li v-for="(item, idx) in items" :key="idx" class="flex items-center" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <svg v-if="idx > 0" class="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
        <router-link v-if="item.to && idx < items.length - 1" :to="item.to" class="text-gray-500 hover:text-emerald-600 transition-colors" itemprop="item">
          <span itemprop="name">{{ item.label }}</span>
        </router-link>
        <span v-else class="text-gray-800 dark:text-gray-200 font-medium" itemprop="name">{{ item.label }}</span>
        <meta itemprop="position" :content="String(idx + 1)" />
      </li>
    </ol>
  </nav>
</template>
