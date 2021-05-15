import { Router } from "express";

import authorizeMiddleware from "../middlewares/authorize.js";
import users from "../routes/users.js";
import login from "../routes/login.js";
import logout from "../routes/logout.js";
import register from "../routes/register.js";
import me from "../routes/me.js";

const router = Router();

router.use("/users", authorizeMiddleware, users);
router.use("/login", login);
router.use("/logout", logout);
router.use("/me", me);
router.use("/register", register);

export default router;
