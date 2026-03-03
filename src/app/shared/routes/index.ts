import { Router } from "express";  
import { SpecialtyRoutes } from "../../modules/specialty/specialty.route";
import { AuthRoutes } from "../../modules/auth/auth.route";
import { UserRoutes } from "../../modules/users/user.route";
import { DoctorRoutes } from "../../modules/doctor/doctor.route";
const router = Router();
router.use("/auth", AuthRoutes);
router.use("/specialties", SpecialtyRoutes);
router.use("/doctors", DoctorRoutes)
router.use("/users", UserRoutes);

export const IndexRoutes = router;