import status from "http-status";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import z from "zod";


export const handleZodError = (err: z.ZodError): TErrorResponse => {
    const statusCode = status.BAD_REQUEST;
    const message = "Zod Validation Error";
    const errorSources: TErrorSources[] = [];

    err.issues.forEach((issue) => {
        errorSources.push({ path: issue.path.join(".") || "unknown", message: issue.message });
    });
    return {
        success: false,
        message,
        errorSources,
        statusCode
    };
}