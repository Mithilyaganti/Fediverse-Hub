import { Router } from 'express';
import { loginWithProvider, linkAccount } from '../services/oauthService';
const router = Router();

// POST login or link account
router.post('/login', async (req, res) => {
  const { provider, code } = req.body;
  // provider: 'twitter' | 'mastodon' | 'reddit', code: OAuth code
  const result = await loginWithProvider(provider, code);
  res.json(result);
});

// POST /link - Link additional account
router.post('/link', async (req, res) => {
  const { provider, code, userId } = req.body;
  const result = await linkAccount(provider, code, userId);
  res.json(result);
});

export default router;
