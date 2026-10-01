export interface ApiError {
  status: number;
  message: string;
  // Los servicios envían `code`; el gateway, en sus propios errores, `error`.
  code?: string;
  error?: string;
  timestamp?: string;
  path?: string;
}
