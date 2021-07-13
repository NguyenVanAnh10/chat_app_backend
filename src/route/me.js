import { Router } from 'express';

import { getMe, putMe } from 'controllers/me';

const router = Router();

router.get('/', getMe);
router.post('/', putMe);

export default router;
