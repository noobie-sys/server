import { Router } from "express";
import { login, protectedRouteController, register } from "../controllers/auth-controller.js";
import { authenticateToken } from "../middleware/auth-middleware.js";


const router = Router();


router.post('/login', login)

router.post("/register" , register)

router.get('/protected-route',authenticateToken, protectedRouteController)

export default router;