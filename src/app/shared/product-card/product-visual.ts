export type ProductFamily = 'packaging' | 'labels' | 'equipment' | 'supplies' | 'other';

export interface ProductVisual {
  family: ProductFamily;
  label: string;
}

const FAMILY_LABEL: Record<ProductFamily, string> = {
  packaging: 'Embalaje',
  labels: 'Etiquetado',
  equipment: 'Equipos',
  supplies: 'Consumibles',
  other: 'Almacén',
};

// El catálogo no tiene imágenes ni categoría: la familia se deduce del prefijo del SKU.
const FAMILY_BY_PREFIX: Record<string, ProductFamily> = {
  CAJ: 'packaging',
  CIN: 'packaging',
  FLM: 'packaging',
  PAL: 'packaging',
  ETQ: 'labels',
  PRE: 'labels',
  LEC: 'equipment',
  BAS: 'equipment',
  TRA: 'equipment',
  GUA: 'supplies',
};

export function productVisual(sku: string): ProductVisual {
  const prefix = sku.split('-')[0]?.toUpperCase() ?? '';
  const family = FAMILY_BY_PREFIX[prefix] ?? 'other';
  return { family, label: FAMILY_LABEL[family] };
}
