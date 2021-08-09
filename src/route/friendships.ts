import { Router } from 'express';

import {
  postFriendship, putFriendship, deleteFriendship,
  getFriendshipsIncoming, getFriendshipsOutgoing,
} from 'controllers/friendships';

const router = Router();

router.post('/', postFriendship);
router.put('/:friendshipId', putFriendship);
router.delete('/:friendshipId', deleteFriendship);

router.get('/incoming', getFriendshipsIncoming);
router.get('/outgoing', getFriendshipsOutgoing);

export default router;
