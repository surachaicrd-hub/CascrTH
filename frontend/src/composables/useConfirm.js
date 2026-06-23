import { ref } from 'vue'

const isConfirmOpen = ref(false)
const confirmState = ref({
    title: 'ยืนยันการทำรายการ',
    message: 'คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?',
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก',
    type: 'danger', // 'danger' | 'warning' | 'info'
    resolve: null
})

export function useConfirm() {
    const showConfirm = (options = {}) => {
        return new Promise((resolve) => {
            confirmState.value = {
                title: options.title || 'ยืนยันการทำรายการ',
                message: options.message || 'คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?',
                confirmText: options.confirmText || 'ตกลง',
                cancelText: options.cancelText || 'ยกเลิก',
                type: options.type || 'danger',
                resolve
            }
            isConfirmOpen.value = true
        })
    }

    const confirmAction = () => {
        if (confirmState.value.resolve) {
            confirmState.value.resolve(true)
        }
        closeConfirm()
    }

    const cancelAction = () => {
        if (confirmState.value.resolve) {
            confirmState.value.resolve(false)
        }
        closeConfirm()
    }

    const closeConfirm = () => {
        isConfirmOpen.value = false
    }

    return {
        isConfirmOpen,
        confirmState,
        showConfirm,
        confirmAction,
        cancelAction
    }
}
