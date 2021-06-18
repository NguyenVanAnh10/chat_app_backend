import { Router } from 'express';

import { getMe, postMe } from 'controllers/me';

const router = Router();

router.get('/', getMe);
router.post('/', postMe);

export default router;
