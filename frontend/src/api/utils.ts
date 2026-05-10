import type { CatalogProduct, Product } from '../types';

type CardProduct = Product | CatalogProduct;

export function productKey(p: CardProduct): string {
  if ('product_id' in p && p.product_id) return p.product_id;
  if ('id' in p && (p as CatalogProduct).id) return (p as CatalogProduct).id;
  return '';
}

/** Deterministic "optimal price" derived from the product ID string (no Math.random). */
export function deriveOptimalPrice(p: CardProduct): number {
  const key = productKey(p);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  // Normalise hash to [-0.08, +0.12] offset from current price
  const factor = -0.08 + ((hash % 1000) / 1000) * 0.20;
  return Math.round(p.current_price * (1 + factor) * 100) / 100;
}
