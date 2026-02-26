import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import status from "http-status";

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const globalErrorHandler = (err: any ,req: Request, res: Response, next: NextFunction) => {
  if (envVars.NODE_ENV === "development") {
    console.error("Global Error Handler:", err);
  }

  const statusCode: number = err.statusCode || status.INTERNAL_SERVER_ERROR;
  const message: string = err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    message,
    error: envVars.NODE_ENV === "development" ? err : undefined,
  });
};