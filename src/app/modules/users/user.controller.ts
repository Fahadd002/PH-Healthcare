import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { doctorService } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createDoctor = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;
        const doctor = await doctorService.createDoctor(payload);
        sendResponse(res, {
           httpStatusCode: status.CREATED,
           success: true,
           message: 'Doctor created successfully',
           data: doctor
         });
    }
);

export const doctorController = {
    createDoctor
}