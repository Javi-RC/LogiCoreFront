import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '../models';

const UNREACHABLE = [0, 502, 503, 504];

// Códigos de error del backend, cuyos mensajes llegan en inglés.
const BY_CODE: Record<string, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro.',
  VALIDATION_ERROR: 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.',
  UNAUTHORIZED: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  ORDER_ACCESS_DENIED: 'Este pedido pertenece a otra cuenta.',
  ORDER_NOT_FOUND: 'No se ha encontrado el pedido.',
  PRODUCT_NOT_FOUND: 'No se ha encontrado el producto.',
  SHIPMENT_NOT_FOUND: 'No se ha encontrado el envío.',
  INVENTORY_ITEM_NOT_FOUND: 'Ese producto todavía no tiene stock registrado.',
  SKU_ALREADY_EXISTS: 'Ya existe un producto con ese SKU.',
  INSUFFICIENT_STOCK: 'No hay stock suficiente para completar la operación.',
  INVALID_ORDER_STATUS_TRANSITION: 'El pedido ya no admite ese cambio de estado.',
  INVALID_SHIPMENT_STATUS_TRANSITION: 'El envío ya no admite ese cambio de estado.',
  CONCURRENT_MODIFICATION: 'Otra persona ha modificado estos datos. Recarga e inténtalo de nuevo.',
  PRODUCT_SERVICE_UNAVAILABLE:
    'El catálogo no está disponible ahora mismo. Inténtalo de nuevo en unos minutos.',
};

// Nunca devuelve el mensaje técnico de HttpClient: incluye la URL interna de la API.
export function extractError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Ha ocurrido un error inesperado.';

  if (UNREACHABLE.includes(err.status)) {
    return 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.';
  }

  const code = (err.error as Partial<ApiError> | null | undefined)?.code;
  if (code && BY_CODE[code]) return BY_CODE[code];

  if (err.status >= 500) return 'El servidor ha tenido un problema. Inténtalo de nuevo más tarde.';
  switch (err.status) {
    case 401:
      return BY_CODE['UNAUTHORIZED'];
    case 403:
      return BY_CODE['FORBIDDEN'];
    case 404:
      return 'No se ha encontrado lo que buscabas.';
    default:
      return 'No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.';
  }
}
