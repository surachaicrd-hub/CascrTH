import { computed } from 'vue'

/**
 * Thai phone number validation:
 * - Must start with 0
 * - Must be 9-10 digits (landline 9, mobile 10)
 * - Strips dashes/spaces before checking
 */
export const isValidThaiPhone = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/[\s\-().]/g, '')
  return /^0\d{8,9}$/.test(cleaned)
}

/**
 * Email validation using standard regex
 */
export const isValidEmail = (email) => {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Thai Tax ID validation:
 * - Must be exactly 13 digits 
 * - Must contain only numbers
 */
export const isValidTaxId = (taxId) => {
  if (!taxId) return false
  const cleaned = taxId.replace(/[\s\-]/g, '')
  return /^\d{13}$/.test(cleaned)
}

/**
 * Composable that returns reactive validation state for form fields.
 * Pass the reactive refs for phone, email, and/or taxId.
 * Returns computed booleans and error message strings.
 *
 * Usage:
 *   const { phoneError, emailError, taxIdError, isAllValid } = useValidation({ phone, email, taxId })
 */
export function useValidation({ phone, email, taxId } = {}) {
  const phoneError = computed(() => {
    if (!phone?.value) return ''
    return isValidThaiPhone(phone.value) ? '' : 'เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก'
  })

  const emailError = computed(() => {
    if (!email?.value) return ''
    return isValidEmail(email.value) ? '' : 'รูปแบบอีเมลไม่ถูกต้อง'
  })

  const taxIdError = computed(() => {
    if (!taxId?.value) return ''
    return isValidTaxId(taxId.value) ? '' : 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'
  })

  const isAllValid = computed(() => {
    const checks = []
    if (phone?.value) checks.push(!phoneError.value)
    if (email?.value) checks.push(!emailError.value)
    if (taxId?.value) checks.push(!taxIdError.value)
    return checks.every(Boolean)
  })

  return { phoneError, emailError, taxIdError, isAllValid, isValidThaiPhone, isValidEmail, isValidTaxId }
}
