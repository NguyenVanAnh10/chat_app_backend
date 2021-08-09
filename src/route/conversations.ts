import { Router } from 'express';

import {
  getConversations,
  getConversation,
  postConversation,
  putConversation,
  deleteConversation,
} from 'controllers/conversations';

const router = Router({ mergeParams: true });

router.get('/', getConversations);
router.post('/', postConversation);
router.get('/:conversationId', getConversation);
router.put('/:conversationId', putConversation);
router.delete('/:conversationId', deleteConversation);

export default router;
