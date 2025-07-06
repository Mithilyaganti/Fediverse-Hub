import { Router } from 'express';
import { postToTwitter } from '../services/twitterService';
import { postToMastodon } from '../services/mastodonService';
import { postToReddit } from '../services/redditService';

const router = Router();

// POST new post or cross-post
router.post('/', async (req, res) => {
  const { content, networks, userToken } = req.body;
  // networks: array of 'twitter' | 'mastodon' | 'reddit'
  const results: Array<{ success: boolean; [key: string]: any }> = [];
  if (networks.includes('twitter')) {
    results.push(await postToTwitter(userToken, content));
  }
  if (networks.includes('mastodon')) {
    results.push(await postToMastodon(userToken, content));
  }
  if (networks.includes('reddit')) {
    results.push(await postToReddit(userToken, content));
  }
  res.json({ success: true, results });
});

export default router;
