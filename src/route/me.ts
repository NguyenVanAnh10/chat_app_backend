import { Router } from 'express';

import { getMe, putMe, putStaticMe } from 'controllers/me';

const router = Router();

router.get('/', getMe);
router.put('/', putMe);
router.put('/static', putStaticMe);

export default router;
