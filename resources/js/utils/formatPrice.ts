/**
 * Formats a number as a price string with currency symbol
 * @param price - The price to format
 * @param currency - The currency symbol (defaults to '$')
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = '$'): string => {
  return `${currency}${price.toFixed(2)}`;
};
