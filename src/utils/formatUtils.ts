
/**
 * Format date string to localized date based on selected language
 */
export const formatDate = (dateString: string, language: string = 'ar') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};
