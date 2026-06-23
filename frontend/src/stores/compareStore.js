import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'morespace_compare'
const MAX_ITEMS = 4

export const useCompareStore = defineStore('compare', () => {
  // Load from localStorage
  const loadItems = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  }

  const items = ref(loadItems()) // Array of { id, name, image_url, price, category }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  }

  const itemCount = computed(() => items.value.length)

  const isInCompare = (productId) => {
    return items.value.some(item => item.id === productId)
  }

  const addToCompare = (product) => {
    if (isInCompare(product.id)) return { success: false, error: 'already_added' }
    if (items.value.length >= MAX_ITEMS) return { success: false, error: 'max_reached' }

    items.value.push({
      id: product.id,
      name: product.name || product.title,
      image_url: product.image_url || product.image,
      price: product.price,
      category: product.category,
      slug: product.slug
    })
    save()
    return { success: true }
  }

  const removeFromCompare = (productId) => {
    items.value = items.value.filter(item => item.id !== productId)
    save()
  }

  const toggleCompare = (product) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
      return { success: true, isAdded: false }
    } else {
      const result = addToCompare(product)
      if (result.success) return { success: true, isAdded: true }
      return result
    }
  }

  const clearAll = () => {
    items.value = []
    save()
  }

  return { items, itemCount, isInCompare, addToCompare, removeFromCompare, toggleCompare, clearAll }
})
