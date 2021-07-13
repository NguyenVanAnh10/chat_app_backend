import { Router } from 'express';

import {
  postFriendship, putFriendship, deleteFriendship,
  getFriendShipsIncoming, getFriendshipsOutgoing,
} from 'controllers/friendships';

const router = Router();

router.post('/', postFriendship);
router.put('/:friendShipId', putFriendship);
router.delete('/:friendShipId', deleteFriendship);

router.get('/incoming', getFriendShipsIncoming);
router.get('/outgoing', getFriendshipsOutgoing);

export default router;
