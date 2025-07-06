import { Router } from 'express';
import { searchAll } from '../services/searchService';
const router = Router();

// GET search posts, users, threads
router.get('/', async (req, res) => {
  const { query, type } = req.query;
  const results = await searchAll(query as string, type as string);
  res.json({ results });
});

export default router;
