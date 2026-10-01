// URL base del backend (API Gateway). Vacío = rutas relativas: en dev el proxy
// (proxy.conf.json) redirige /api al gateway en http://localhost:8080.
export const environment = {
  apiBase: '',
  // Acceso de demostración. Son las cuentas que el backend crea al arrancar con
  // DEMO_ACCOUNTS_ENABLED=true; sus credenciales son públicas a propósito.
  // Con `enabled: false` desaparecen los botones de acceso demo.
  demo: {
    enabled: true,
    admin: { email: 'admin.demo@logicore.dev', password: 'demo-admin-2026' },
    customer: { email: 'cliente.demo@logicore.dev', password: 'demo-cliente-2026' },
  },
};
