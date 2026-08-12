require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/document');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/syncwrite')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// WebSocket Server for Yjs
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req, { docName }) => {
  setupWSConnection(ws, req, { docName });
});

// Handle upgrade for y-websocket
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname.startsWith('/yjs/')) {
    const docName = url.pathname.split('/').pop();
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request, { docName });
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
