/** 表单校验工具 */

/** 校验手机号 */
function isPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 校验价格（正数，最多两位小数） */
function isPrice(val) {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0 && /^\d+(\.\d{1,2})?$/.test(val);
}

/** 非空校验 */
function isNotEmpty(val) {
  return val !== null && val !== undefined && String(val).trim().length > 0;
}

module.exports = { isPhone, isPrice, isNotEmpty };
