import { Router } from "express";
import { doctorController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createDoctorZodSchema } from "./user.validation";

const router = Router();

router.post('/create-doctor', validateRequest(createDoctorZodSchema), doctorController.createDoctor);

export const UserRoutes = router;