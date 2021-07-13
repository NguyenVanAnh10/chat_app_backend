import { Router } from 'express';

import getFriends from 'controllers/friends';

const router = Router();

router.get('/', getFriends);

export default router;
