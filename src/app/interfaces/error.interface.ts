export interface TErrorSources {
  path: string;
  message: string;
}
 export interface TErrorResponse {
  success: boolean;
  message: string;
  error?: unknown;
  errorSources: TErrorSources[];
  statusCode?: number;
  stack?: string;
}