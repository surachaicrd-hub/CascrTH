<script setup>
import { useConfirm } from '../composables/useConfirm'

const { isConfirmOpen, confirmState, confirmAction, cancelAction } = useConfirm()
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isConfirmOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        @click="cancelAction"
      ></div>

      <!-- Modal panel -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
        enter-to-class="scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="scale-100 opacity-100 translate-y-0"
        leave-to-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
      >
        <div v-if="isConfirmOpen" class="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm overflow-hidden transform transition-all border border-gray-100 dark:border-gray-700">
          <div class="flex flex-col items-center text-center">
            <div 
              class="mx-auto shrink-0 flex items-center justify-center h-16 w-16 rounded-full mb-5"
              :class="{
                'bg-red-50 text-red-600': confirmState.type === 'danger',
                'bg-amber-50 text-amber-600': confirmState.type === 'warning',
                'bg-blue-50 text-blue-600': confirmState.type === 'info'
              }"
            >
              <svg 
                class="h-8 w-8"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="confirmState.type === 'danger' ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'" />
              </svg>
            </div>
            
            <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2" id="modal-title">
              {{ confirmState.title }}
            </h3>
            
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm" v-html="confirmState.message"></p>
          </div>
          
          <div class="mt-8 flex justify-center gap-3 w-full">
            <button 
              type="button" 
              class="flex-1 inline-flex justify-center items-center rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
              @click="cancelAction"
            >
              {{ confirmState.cancelText }}
            </button>
            <button 
              type="button" 
              class="flex-1 inline-flex justify-center items-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-bold text-white shadow-sm focus:outline-none transition-colors"
              :class="{
                'bg-red-600 hover:bg-red-700': confirmState.type === 'danger',
                'bg-amber-600 hover:bg-amber-700': confirmState.type === 'warning',
                'bg-blue-600 hover:bg-blue-700': confirmState.type === 'info'
              }"
              @click="confirmAction"
            >
              {{ confirmState.confirmText }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>
