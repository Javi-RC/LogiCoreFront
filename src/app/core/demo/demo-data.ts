export interface DemoProduct {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

// Catálogo de ejemplo: cubre los tres rangos de precio de la tienda y deja un producto con stock bajo.
export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    sku: 'CAJ-302020',
    name: 'Caja de cartón 30×20×20 (pack de 25)',
    description: 'Cartón de canal doble para envíos de hasta 20 kg. Se entrega plegada.',
    price: 289,
    stock: 120,
  },
  {
    sku: 'CIN-48',
    name: 'Cinta de embalar 48 mm (6 rollos)',
    description:
      'Cinta adhesiva transparente de 66 m por rollo, compatible con dispensador manual.',
    price: 95.5,
    stock: 200,
  },
  {
    sku: 'ETQ-100150',
    name: 'Etiquetas térmicas 100×150 (rollo de 500)',
    description:
      'Etiquetas de envío para impresoras térmicas directas. No necesitan cinta de tinta.',
    price: 35,
    stock: 300,
  },
  {
    sku: 'FLM-500',
    name: 'Film estirable 500 mm',
    description: 'Bobina de film transparente de 23 micras para asegurar la carga en el palé.',
    price: 78.4,
    stock: 80,
  },
  {
    sku: 'PAL-EUR',
    name: 'Palé europeo 1200×800',
    description:
      'Palé de madera homologado con tratamiento fitosanitario. Carga dinámica de 1500 kg.',
    price: 185,
    stock: 40,
  },
  {
    sku: 'GUA-NIT',
    name: 'Guantes de nitrilo (caja de 100)',
    description: 'Guantes desechables sin polvo para manipulado y preparación de pedidos.',
    price: 42.9,
    stock: 150,
  },
  {
    sku: 'PRE-100',
    name: 'Precintos de seguridad (100 unidades)',
    description: 'Precintos numerados de un solo uso para contenedores, jaulas y sacas.',
    price: 64,
    stock: 90,
  },
  {
    sku: 'LEC-2D',
    name: 'Lector de códigos 2D inalámbrico',
    description: 'Lee códigos de barras y QR, con base de carga y hasta 12 horas de autonomía.',
    price: 1299,
    stock: 3,
  },
  {
    sku: 'BAS-150',
    name: 'Báscula de plataforma 150 kg',
    description: 'Plataforma de acero de 40×50 cm con pantalla remota y función de tara.',
    price: 2450,
    stock: 12,
  },
  {
    sku: 'TRA-2500',
    name: 'Transpaleta manual 2500 kg',
    description: 'Horquillas de 1150 mm y ruedas de poliuretano para suelos de almacén.',
    price: 5890,
    stock: 6,
  },
];

export interface DemoOrder {
  items: { sku: string; quantity: number }[];
  // Hasta dónde se avanza el envío que la saga crea al confirmarse el pedido.
  shipment: 'created' | 'shipped' | 'delivered';
}

// Pedidos de ejemplo: uno en cada etapa y uno que pide más unidades de las que hay.
export const DEMO_ORDERS: DemoOrder[] = [
  {
    items: [
      { sku: 'CAJ-302020', quantity: 2 },
      { sku: 'CIN-48', quantity: 3 },
    ],
    shipment: 'delivered',
  },
  {
    items: [
      { sku: 'PAL-EUR', quantity: 1 },
      { sku: 'FLM-500', quantity: 4 },
    ],
    shipment: 'shipped',
  },
  { items: [{ sku: 'ETQ-100150', quantity: 10 }], shipment: 'created' },
  { items: [{ sku: 'BAS-150', quantity: 1 }], shipment: 'created' },
  { items: [{ sku: 'LEC-2D', quantity: 5 }], shipment: 'created' },
];
