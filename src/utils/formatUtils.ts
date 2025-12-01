// src/utils/formatUtils.ts

export const formatUtils = {
  /**
   * Format currency with Indian numbering system
   */
  formatCurrency(amount: number | string | null | undefined, currency: string = 'INR'): string {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return 'N/A';

    // Indian numbering system (lakhs, crores)
    if (currency === 'INR') {
      return this.formatIndianCurrency(numAmount);
    }

    // International format
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount);
  },

  /**
   * Format in Indian numbering system (Lakhs/Crores)
   */
  formatIndianCurrency(amount: number): string {
    const crore = 10000000;
    const lakh = 100000;

    if (amount >= crore) {
      const crores = (amount / crore).toFixed(2);
      return `₹${crores} Cr`;
    } else if (amount >= lakh) {
      const lakhs = (amount / lakh).toFixed(2);
      return `₹${lakhs} L`;
    } else if (amount >= 1000) {
      const thousands = (amount / 1000).toFixed(2);
      return `₹${thousands} K`;
    }

    return `₹${amount.toFixed(2)}`;
  },

  /**
   * Truncate text to specified length
   */
  truncate(text: string | null | undefined, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  },

  /**
   * Format document progress (e.g., "5/8")
   */
  formatDocProgress(completed: number, total: number): string {
    return `${completed}/${total}`;
  },

  /**
   * Get initials from name for avatar
   */
  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Format location string
   */
  formatLocation(city: string | null | undefined, state: string | null | undefined): string {
    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    return parts.join(', ') || 'N/A';
  }
};
