import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import timelineRoutes from './routes/timeline';
import authRoutes from './routes/auth';
import postRoutes from './routes/post';
import messageRoutes from './routes/message';
import notificationRoutes from './routes/notification';
import threadRoutes from './routes/thread';
import searchRoutes from './routes/search';
import connectDB from './config/database';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

app.use('/api/timeline', timelineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/thread', threadRoutes);
app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
  res.send('Fediverse Aggregator Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
