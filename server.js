const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = {};
const rooms = {};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Handle user joining with a username
  socket.on('join', (data) => {
    const { username, room } = data;

    if (!username || !room) {
      socket.emit('error', 'Username and room are required');
      return;
    }

    // Store user info
    users[socket.id] = {
      username,
      room,
      id: socket.id
    };

    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = [];
    }

    // Add user to room
    rooms[room].push(users[socket.id]);
    socket.join(room);

    // Notify room members about the new user
    io.to(room).emit('userJoined', {
      username,
      userCount: rooms[room].length,
      users: rooms[room],
      message: `${username} has joined the chat`
    });

    console.log(`${username} joined room: ${room}`);
  });

  // Handle incoming messages
  socket.on('sendMessage', (data) => {
    const user = users[socket.id];

    if (!user) {
      socket.emit('error', 'User not found');
      return;
    }

    const message = {
      username: user.username,
      text: data.message,
      timestamp: new Date().toLocaleTimeString(),
      userId: socket.id
    };

    // Broadcast message to all users in the room
    io.to(user.room).emit('receiveMessage', message);

    console.log(`Message from ${user.username} in ${user.room}: ${data.message}`);
  });

  // Handle user typing indicator
  socket.on('typing', () => {
    const user = users[socket.id];

    if (user) {
      socket.to(user.room).emit('userTyping', {
        username: user.username,
        userId: socket.id
      });
    }
  });

  // Handle stop typing
  socket.on('stopTyping', () => {
    const user = users[socket.id];

    if (user) {
      socket.to(user.room).emit('userStoppedTyping', {
        userId: socket.id
      });
    }
  });

  // Handle emoji reactions
  socket.on('addReaction', (data) => {
    const user = users[socket.id];

    if (user) {
      io.to(user.room).emit('addReaction', {
        messageId: data.messageId,
        emoji: data.emoji,
        username: user.username
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const user = users[socket.id];

    if (user) {
      const { username, room } = user;

      // Remove user from room
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(u => u.id !== socket.id);
      }

      // Notify room members
      io.to(room).emit('userLeft', {
        username,
        userCount: rooms[room] ? rooms[room].length : 0,
        users: rooms[room] || [],
        message: `${username} has left the chat`
      });

      // Clean up empty rooms
      if (rooms[room] && rooms[room].length === 0) {
        delete rooms[room];
      }

      console.log(`${username} left room: ${room}`);
    }

    delete users[socket.id];
    console.log(`User disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// REST API endpoints
app.get('/api/rooms', (req, res) => {
  const roomList = Object.keys(rooms).map(room => ({
    name: room,
    userCount: rooms[room].length,
    users: rooms[room].map(u => u.username)
  }));
  res.json(roomList);
});

app.get('/api/users/:room', (req, res) => {
  const { room } = req.params;

  if (!rooms[room]) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.json({
    room,
    userCount: rooms[room].length,
    users: rooms[room].map(u => u.username)
  });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Chat Server Running`);
  console.log(`📍 Server is listening on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for connections\n`);
});
