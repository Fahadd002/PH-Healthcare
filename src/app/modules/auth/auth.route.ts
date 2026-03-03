import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router()

router.post("/register", AuthController.registerPatient)
router.post("/login", AuthController.loginUser)
router.post("/refresh-token", AuthController.getNewToken)
router.get("/me", checkAuth(Role.ADMIN, Role.PATIENT, Role.DOCTOR, Role.SUPER_ADMIN), AuthController.getMe)

export const AuthRoutes = router;