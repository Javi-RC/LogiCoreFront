# LogiCore — Frontend

Frontend de la plataforma de logística distribuida **LogiCore** (proyecto integrador).
Es el repositorio **independiente** del backend: consume su API REST a través del
**API Gateway** (`http://localhost:8080`).

Hecho con **Angular 22 + TypeScript**: componentes standalone, signals para el estado,
detección de cambios zoneless y `HttpClient` con interceptor funcional.
Sin librería de componentes: CSS propio con un sistema de diseño simple (tema claro y oscuro)
e iconos de `@lucide/angular`.

## Requisitos

- Node.js 22.22+ o 24.15+ (probado con 24)
- El backend LogiCore corriendo:

```bash
docker compose up -d   # PostgreSQL, Kafka, Kafka UI
# ... y los 6 servicios + el gateway en :8080 (ver README del repositorio LogiCore)
```

## Puesta en marcha

```bash
npm install
npm start            # http://localhost:4200  (proxy /api -> :8080)
npm run build        # typecheck + bundle de producción en dist/logicore-frontend
npm run typecheck    # solo comprobación de tipos
```

Para servir el build de producción:

```bash
npx http-server dist/logicore-frontend/browser -p 4200
```

Si el backend no está en `localhost:8080`, cambia el destino del proxy en `proxy.conf.json`
(desarrollo) o `apiBase` en `src/environments/environment.ts` (build).

## Cuentas y roles

El registro pide el rol explícitamente:

- **Cliente** (`CUSTOMER`): tienda, carrito, crear pedido y ver su estado + notificaciones.
- **Administrador** (`ADMIN`): dashboard, productos, inventario (registrar/reservar/liberar stock),
  pedidos, envíos y notificaciones.

> Nota: el gateway protege `/**` salvo `/api/auth/**`, así que toda la app requiere sesión.

## Flujo que demuestra (saga vía Kafka)

1. El admin crea productos y registra stock.
2. El cliente agrega productos al carrito y crea el pedido.
3. `order-service` publica `OrderCreated`; en la vista de estado el pedido está **Pendiente** y se
   actualiza en vivo (polling) mientras la saga corre.
4. `inventory-service` reserva stock → `StockReserved` → pedido **Confirmado**; en automático se
   genera un envío y las **notificaciones** van apareciendo en la página de estado del pedido.
5. El admin despacha el envío (**Enviado**) y lo marca como **Entregado**.

## Rutas

| Ruta                   | Pantalla                    | Acceso        |
| ---------------------- | --------------------------- | ------------- |
| `/login`, `/register`  | Inicio de sesión y registro | Sin sesión    |
| `/`                    | Tienda (catálogo)           | Con sesión    |
| `/cart`                | Carrito                     | Con sesión    |
| `/orders`              | Mis pedidos                 | Con sesión    |
| `/orders/:id`          | Estado del pedido           | Con sesión    |
| `/admin`               | Dashboard                   | Rol `ADMIN`   |
| `/admin/products`      | Productos                   | Rol `ADMIN`   |
| `/admin/inventory`     | Inventario                  | Rol `ADMIN`   |
| `/admin/orders`        | Pedidos                     | Rol `ADMIN`   |
| `/admin/shipments`     | Envíos                      | Rol `ADMIN`   |
| `/admin/notifications` | Actividad                   | Rol `ADMIN`   |

Todas las pantallas se cargan de forma diferida (`loadComponent`).

## Estructura

```
src/
├── styles.css            # sistema de diseño global (tokens, tema claro/oscuro)
├── styles/animations.css # animaciones globales
├── environments/         # apiBase del backend
└── app/
    ├── app.config.ts     # router, HttpClient + interceptor, inicialización del tema
    ├── app.routes.ts     # rutas + guards
    ├── core/
    │   ├── api/          # endpoints por dominio, interceptor de sesión y extractError
    │   ├── models/       # DTOs que replican los contratos del backend
    │   ├── services/     # estado con signals: auth, cart, toast, confirm, theme
    │   ├── guards/       # authGuard, adminGuard, guestGuard
    │   ├── storage.ts    # sesión y carrito persistidos en localStorage
    │   └── util/         # formato de moneda, fechas e identificadores
    ├── shared/           # status-badge, product-card, order-timeline y ui/ (toaster,
    │                     # confirm-dialog, copy-id, empty-state)
    ├── layouts/          # public-layout (tienda) y admin-layout (panel con sidebar)
    └── features/         # auth, shop, orders, admin y not-found
```

## Autenticación

El login devuelve un JWT que se guarda en `localStorage` (`logicore.auth`). Un interceptor
añade `Authorization: Bearer <token>` a cada petición y, ante un `401`, cierra la sesión y
redirige a `/login`. Los guards protegen las rutas por sesión y por rol.

## Endpoints consumidos (espejo del backend)

| Recurso           | Métodos usados                                                    |
| ----------------- | ----------------------------------------------------------------- |
| Auth              | `POST /api/auth/register`, `POST /api/auth/login` (públicos)      |
| Productos         | `GET/POST/PUT/DELETE /api/products` + `activate` / `deactivate`   |
| Inventario        | `POST /api/inventory`, `GET/{productId}`, `reserve`, `release`    |
| Pedidos           | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`, `cancel` |
| Envíos            | `GET/POST /api/shipments`, `ship`, `deliver`, `by order`          |
| Notificaciones    | `GET /api/notifications`, `GET /api/notifications/correlation/{id}` |

## CI

`.github/workflows/ci.yml` ejecuta `npm ci && npm run build` en cada push/PR a `main`.

## Repositorio del backend

Código: `git@github.com:Javi-RC/LogiCore.git` — microservicios (Java 17,
Spring Boot 3.2, hexagonal, Kafka, PostgreSQL, JWT).
