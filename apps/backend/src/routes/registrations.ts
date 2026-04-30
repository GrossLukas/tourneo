import { Router } from 'express';
import { RegistrationController } from '../controllers/registrationController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createRegistrationSchema, cancelRegistrationSchema } from '../validators/registrations';

const router = Router();

router.get('/', authenticate, RegistrationController.listUserRegistrations);
router.get('/my', authenticate, RegistrationController.listUserRegistrations);
router.get('/:id', authenticate, RegistrationController.getById);
router.get('/:id/waitlist-status', authenticate, RegistrationController.waitlistStatus);
router.get('/:id/checkin-token', authenticate, RegistrationController.getCheckinToken);
router.get('/:id/checkin-qr.png', authenticate, RegistrationController.getCheckinQr);
router.post('/', authenticate, validateBody(createRegistrationSchema), RegistrationController.register);
router.put('/:id/cancel', authenticate, validateBody(cancelRegistrationSchema), RegistrationController.cancel);
router.post('/:id/checkin', authenticate, RegistrationController.checkIn);

export { router as registrationRouter };
