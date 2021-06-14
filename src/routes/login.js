import { Router } from 'express';

import postLogin from 'controllers/login';

const router = Router();

router.post('/', postLogin);

export default router;
