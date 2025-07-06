import { Router } from 'express';
import { createThread, getThreads, replyToThread } from '../services/threadService';
const router = Router();

// POST create a new thread
router.post('/', async (req, res) => {
  const { author, title, content } = req.body;
  const thread = await createThread(author, title, content);
  res.json({ thread });
});

// GET fetch all threads
router.get('/', async (req, res) => {
  const threads = await getThreads();
  res.json({ threads });
});

// POST reply to a thread
router.post('/:threadId/reply', async (req, res) => {
  const { author, content } = req.body;
  const { threadId } = req.params;
  const reply = await replyToThread(threadId, author, content);
  res.json({ reply });
});

export default router;
