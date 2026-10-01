import type { OrderItem } from '../models';
import { shortId } from './format';

// «Caja de cartón ×2 y 1 más»: identifica un pedido por lo que contiene, no por su ID.
export function summarizeItems(items: OrderItem[], names: Record<string, string>): string {
  if (items.length === 0) return 'Pedido sin artículos';
  const [first, ...rest] = [...items].sort((a, b) => b.subtotal - a.subtotal);
  const name = names[first.productId] ?? `Producto ${shortId(first.productId, 6)}`;
  const head = first.quantity > 1 ? `${name} ×${first.quantity}` : name;
  return rest.length === 0 ? head : `${head} y ${rest.length} más`;
}
