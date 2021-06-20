import { Router } from 'express';

import {
  getUser,
  getUsers,
  getFriends,
  deleteFriend,
  postAddFriend,
  postConfirmAddFriend,
  getFriendRequest,
} from 'controllers/user';

const router = Router();

router.get('/', getUsers);
router.route('/:userId').get(getUser);
router.route('/:userId/friends').get(getFriends);
router.route('/:userId/friends').post(postAddFriend);
router.route('/:userId/friends/:friendId').post(postConfirmAddFriend);
router.route('/:userId/friends/:friendId/friend-request').get(getFriendRequest);
router.route('/:userId/friends/:friendId').delete(deleteFriend);

export default router;
