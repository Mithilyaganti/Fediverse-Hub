import { Router } from 'express';
import { sendMessage, getMessages } from '../services/messageService';

const router = Router();

// POST send message
router.post('/', async (req, res) => {
  const { fromUser, toUser, content } = req.body;
  const result = await sendMessage(fromUser, toUser, content);
  res.json(result);
});

// GET fetch messages
router.get('/', async (req, res) => {
  const { userId } = req.query;
  const messages = await getMessages(userId as string);
  res.json({ messages });
});

export default router;
