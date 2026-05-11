import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Message from './models/Message.js';
import User from './models/User.js';

dotenv.config();

// Server Setup
const app = express();
const server = createServer(app);
const io = new Server(server);

// Static File Serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Default profile pictures
const defaultProfilePics = [
  'https://avatars.dicebear.com/api/bottts/1.svg',
  'https://avatars.dicebear.com/api/bottts/2.svg',
  'https://avatars.dicebear.com/api/bottts/3.svg',
  'https://avatars.dicebear.com/api/bottts/4.svg',
  'https://avatars.dicebear.com/api/bottts/5.svg',
];
const randomPic = defaultProfilePics[Math.floor(Math.random() * defaultProfilePics.length)];


// Track connected users
const users = new Map(); // socket.id => { name, profilePic }

io.on('connection', async (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Send recent chat history
  const recentMessages = await Message.find().sort({ timestamp: 1 }).limit(50);
  recentMessages.forEach((msg) => {
    socket.emit('chat-message', msg);
  });

  // New user joins
  socket.on('new-user', async (name) => {
    const profilePic = defaultProfilePics[Math.floor(Math.random() * defaultProfilePics.length)];
    users.set(socket.id, { name, profilePic });

    // Save user to DB
    await User.create({ socketId: socket.id, name, profilePic });

    io.emit('user-list', Array.from(users.values()));
    console.log(`${name} joined`);
  });

  // Chat message received
  socket.on('chat-message', async (msg) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageData = {
      userName: user.name,
      profilePic: user.profilePic,
      content: msg,
      timestamp: new Date()
    };

    // Save to DB
    await Message.create(messageData);

    // Broadcast to all clients
    io.emit('chat-message', messageData);
  });

  // Typing indicators
  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('typing', user.name);
    }
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('stop-typing');
  });

  // User disconnects
  socket.on('disconnect', async () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.name} disconnected`);
      users.delete(socket.id);
      await User.deleteOne({ socketId: socket.id });
      io.emit('user-list', Array.from(users.values()));
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ChatterUp running on http://localhost:${PORT}`);
});
