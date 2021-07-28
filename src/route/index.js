import { Router } from 'express';

import authorizeMiddleware from 'middlewares/authorize';
import me from 'route/me';
import users from 'route/users';
import messages from 'route/messages';
import conversations from 'route/conversations';
import friends from 'route/friends';
import friendships from 'route/friendships';
import {
  postLogin,
  postLogout,
  putOnline,
  postResetPassword,
  getValidateRegisteredEmail,
} from 'controllers/userServices';

const router = Router();
console.log(' process.env test', process.env);

router.post('/login', postLogin);
router.post('/logout', postLogout);
router.get('/validate_email', getValidateRegisteredEmail);
router.post('/reset_password', postResetPassword);
router.put('/online', authorizeMiddleware, putOnline);

router.use('/me', authorizeMiddleware, me);
router.use('/friends', authorizeMiddleware, friends);
router.use('/friendships', authorizeMiddleware, friendships);
router.use('/users', users);
router.use('/conversations', authorizeMiddleware, conversations);
router.use('/messages', authorizeMiddleware, messages);

export default router;
