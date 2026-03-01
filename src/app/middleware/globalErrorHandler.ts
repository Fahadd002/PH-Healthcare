import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import status from "http-status";
import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import { handleZodError } from "../errorHelpers/handleZodError";

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (envVars.NODE_ENV === "development") {
    console.error("Global Error Handler:", err);
  }

  let statusCode: number = err.statusCode || status.INTERNAL_SERVER_ERROR;
  let message: string = err.message || "An unexpected error occurred";
  let errorSources: TErrorSources[] = [];
  let stack : string | undefined = undefined;

  if (err instanceof z.ZodError) {
    const simpleError = handleZodError(err);
    statusCode = simpleError.statusCode as number;
    message = simpleError.message;
    errorSources = [...simpleError.errorSources];
  } 
  else if (err instanceof Error) {
    statusCode =  status.INTERNAL_SERVER_ERROR;
    message = err.message || "An unexpected error occurred";
    stack = err.stack;
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message : message,
    errorSources,
    error: envVars.NODE_ENV === "development" ? err : undefined,
    stack: envVars.NODE_ENV === "development" ? stack : undefined
  };

  res.status(statusCode).json(errorResponse);
};