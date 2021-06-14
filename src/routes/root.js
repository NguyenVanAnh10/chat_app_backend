import { Router } from 'express';

import authorizeMiddleware from 'middlewares/authorize';
import users from 'routes/users';
import login from 'routes/login';
import logout from 'routes/logout';
import register from 'routes/register';
import me from 'routes/me';
import message from 'routes/message';
import chatRoom from 'routes/chatRoom';

const router = Router();

router.use('/users', authorizeMiddleware, users);
router.use('/messages', authorizeMiddleware, message);
router.use('/chat_rooms', authorizeMiddleware, chatRoom);
router.use('/login', login);
router.use('/logout', logout);
router.use('/me', me);
router.use('/register', register);

export default router;
