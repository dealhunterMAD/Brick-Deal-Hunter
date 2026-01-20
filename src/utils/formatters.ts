// ============================================
// BRICK DEAL HUNTER - FORMATTERS
// ============================================
// Helper functions for formatting data for display.
// These make prices, dates, and numbers look nice.

/**
 * Format a number as US currency
 * @param amount - The dollar amount
 * @returns Formatted string like "$29.99"
 *
 * Example: formatCurrency(29.99) => "$29.99"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted string like "1,234"
 *
 * Example: formatNumber(1234) => "1,234"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format percentage for display
 * @param percent - The percentage value (0-100)
 * @returns Formatted string like "25%"
 */
export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Format a date as relative time
 * @param date - The date to format
 * @returns Relative time like "2 hours ago"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  // More than a week, show the date
  return formatDate(date);
}

/**
 * Format a date as short date
 * @param date - The date to format
 * @returns Formatted string like "Jan 15, 2024"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date as date and time
 * @param date - The date to format
 * @returns Formatted string like "Jan 15, 2024 at 3:30 PM"
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format set number for display
 * @param setNumber - The set number like "75192-1"
 * @returns Cleaned number like "75192"
 */
export function formatSetNumber(setNumber: string): string {
  // Remove the "-1" suffix that Rebrickable adds
  return setNumber.replace(/-\d+$/, '');
}

/**
 * Format piece count with label
 * @param numParts - Number of pieces
 * @returns Formatted string like "7,541 pieces" or empty string if no data
 */
export function formatPieceCount(numParts: number | undefined | null): string {
  if (numParts === undefined || numParts === null || isNaN(numParts)) {
    return '';
  }
  return `${formatNumber(numParts)} piece${numParts === 1 ? '' : 's'}`;
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum character length
 * @returns Truncated text with "..." if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format savings for display
 * @param savings - Dollar amount saved
 * @returns Formatted string like "Save $20"
 */
export function formatSavings(savings: number): string {
  if (savings <= 0) return '';
  return `Save ${formatCurrency(savings)}`;
}

/**
 * Format price per piece
 * @param pricePerPiece - Price per piece in dollars
 * @returns Formatted string like "$0.12/pc"
 */
export function formatPricePerPiece(pricePerPiece: number): string {
  return `$${pricePerPiece.toFixed(2)}/pc`;
}

/**
 * Get a greeting based on time of day
 * @returns Greeting string
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format stock status
 * @param inStock - Whether item is in stock
 * @returns Status string
 */
export function formatStockStatus(inStock: boolean): string {
  return inStock ? 'In Stock' : 'Out of Stock';
}
