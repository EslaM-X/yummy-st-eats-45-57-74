
/**
 * تنسيق العملة ST
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} ST`;
};

/**
 * تنسيق العملة مع فاصلة الآلاف
 */
export const formatCurrencyWithCommas = (amount: number): string => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ST`;
};

/**
 * تنسيق التاريخ باللغة العربية
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * تنسيق الوقت
 */
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * تنسيق التاريخ والوقت معاً
 */
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} - ${formatTime(date)}`;
};

/**
 * تحويل النسبة إلى نص
 */
export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

/**
 * تنسيق رقم الهاتف
 */
export const formatPhoneNumber = (phone: string): string => {
  // إزالة الأرقام غير المرغوب فيها وتنسيق رقم سعودي
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('966')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};
