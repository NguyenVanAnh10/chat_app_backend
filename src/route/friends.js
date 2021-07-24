import { Router } from 'express';

import { getFriends, getFriend } from 'controllers/friends';

const router = Router();

router.get('/', getFriends);
router.get('/:friendId', getFriend);

export default router;
