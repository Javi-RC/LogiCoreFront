export type NavIcon = 'dashboard' | 'package' | 'boxes' | 'cart' | 'truck' | 'activity';

export interface NavLink {
  to: string;
  label: string;
  icon: NavIcon;
}

export interface NavSection {
  label: string;
  links: NavLink[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    label: 'Resumen',
    links: [{ to: '/admin', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    label: 'Catálogo',
    links: [
      { to: '/admin/products', label: 'Productos', icon: 'package' },
      { to: '/admin/inventory', label: 'Inventario', icon: 'boxes' },
    ],
  },
  {
    label: 'Operaciones',
    links: [
      { to: '/admin/orders', label: 'Pedidos', icon: 'cart' },
      { to: '/admin/shipments', label: 'Envíos', icon: 'truck' },
    ],
  },
  {
    label: 'Monitoreo',
    links: [{ to: '/admin/notifications', label: 'Actividad', icon: 'activity' }],
  },
];
