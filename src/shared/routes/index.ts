import { Router } from "express";  
import { SpecialtyRoutes } from "../../app/modules/specialty/specialty.route";
import { AuthRoutes } from "../../app/modules/new/auth.route";
const router = Router();
router.use("/auth", AuthRoutes);
router.use("/specialties", SpecialtyRoutes);

export const IndexRoutes = router;