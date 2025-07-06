import { Router } from 'express';
import { fetchNotifications } from '../services/notificationService';

const router = Router();

// GET notifications
router.get('/', async (req, res) => {
  const userToken = req.headers['authorization'] || '';
  const notifications = await fetchNotifications(userToken as string);
  res.json({ notifications });
});

export default router;
