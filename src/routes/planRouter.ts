import { planController } from '@/controllers';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

router.get('/active', planController.getActivePlans);

router.use(protect);
router.get('/all', planController.getAllPlans);
router.get('/:id', planController.getPlanById);
router.post('/create', planController.createPlan);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

export { router as planRouter };
