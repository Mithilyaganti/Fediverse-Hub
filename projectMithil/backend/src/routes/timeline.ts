import { Router } from 'express';
import { fetchTwitterPosts } from '../services/twitterService';
import { fetchMastodonPosts } from '../services/mastodonService';
import { fetchRedditPosts } from '../services/redditService';

const router = Router();

// GET unified timeline
router.get('/', async (req, res) => {
  // Example: get user tokens from req (in real app, use auth middleware)
  const userToken = req.headers['authorization'] || '';
  // Fetch posts from all networks in parallel
  const [twitter, mastodon, reddit] = await Promise.all([
    fetchTwitterPosts(userToken as string),
    fetchMastodonPosts(userToken as string),
    fetchRedditPosts(userToken as string)
  ]);
  // Combine and sort posts (by date, etc.)
  const timeline = [...twitter, ...mastodon, ...reddit];
  res.json({ timeline });
});

export default router;
