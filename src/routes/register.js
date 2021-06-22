import { Router } from 'express';

import { getValidateRegisteredEmail, postRegisterAccount, postSetPasswordRegister } from 'controllers/register';

const router = Router();

router.post('/', postRegisterAccount);
router.get('/validate_email', getValidateRegisteredEmail);
router.post('/set_password', postSetPasswordRegister);

export default router;
