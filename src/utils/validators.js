/**
 * 表单验证工具函数
 */

// 邮箱验证
export const validateEmail = (value) => {
  if (!value) return '请输入邮箱'
  if (!/.+@.+\..+/.test(value)) return '邮箱格式不正确'
  return true
}

// 密码验证
export const validatePassword = (value) => {
  if (!value) return '请输入密码'
  if (value.length < 3) return '密码长度不能少于3位'
  return true
}

// 手机号验证
export const validatePhone = (value) => {
  if (!value) return '请输入手机号'
  // 中国大陆手机号格式验证（11位数字，以1开头）
  if (!/^1[3-9]\d{9}$/.test(value)) return '手机号格式不正确'
  return true
}

// 姓名验证
export const validateName = (value) => {
  if (!value) return '请输入姓名'
  if (value.length <= 2) return '姓名长度不能少于2个字符'
  // 可以根据需要添加更多的验证规则，例如限制特殊字符等
  return true
}

// 表单提交前验证
export const validateForm = (form) => {
  const errors = {}
  
  const emailResult = validateEmail(form.email)
  if (emailResult !== true) errors.email = emailResult
  
  const passwordResult = validatePassword(form.password)
  if (passwordResult !== true) errors.password = passwordResult
  
  // 如果表单包含手机号，验证手机号
  if (form.phone !== undefined) {
    const phoneResult = validatePhone(form.phone)
    if (phoneResult !== true) errors.phone = phoneResult
  }
  
  // 如果表单包含姓名，验证姓名
  if (form.name !== undefined) {
    const nameResult = validateName(form.name)
    if (nameResult !== true) errors.name = nameResult
  }
  
  return Object.keys(errors).length === 0 ? true : errors
}