import { Router } from 'express';

import authorizeMiddleware from 'middlewares/authorize';
import { getUser, getUsers, postUserRegistration } from 'controllers/users';

const router = Router();

router.get('/', authorizeMiddleware, getUsers);
router.get('/:userId', authorizeMiddleware, getUser);
router.post('/register', postUserRegistration);

export default router;
