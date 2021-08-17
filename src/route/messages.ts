import { Router } from 'express';

import {
  getMessages,
  postMessage,
  getMessage,
  postSeenMessages,
  getSeenMessages,
  deleteMessage,
  getUnseenMessages,
} from 'controllers/messages';

const router = Router();

router.get('/', getMessages);
router.post('/', postMessage);
router.get('/seen', getSeenMessages);
router.get('/unseen', getUnseenMessages);
router.post('/seen', postSeenMessages);
router.get('/:messageId', getMessage);
router.delete('/:messageId', deleteMessage);
// router.put('/:messageId', putMessage);

export default router;
