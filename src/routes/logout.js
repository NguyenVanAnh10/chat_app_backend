import { Router } from 'express';

import postLogout from 'controllers/logout';

const router = Router();

router.post('/', postLogout);

export default router;
