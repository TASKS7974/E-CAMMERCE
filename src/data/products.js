export const CATEGORIES = ['All', 'Clothing', 'Shoes', 'Bags', 'Home', 'Beauty'];

export function formatPrice(amount) {
  return `RWF ${Number(amount).toLocaleString('en-RW')}`;
}
