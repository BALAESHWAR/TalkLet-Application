# 🚀 Real-Time Chat Application

A fully functional real-time chat application built with **Node.js**, **Express**, and **Socket.IO**. Users can create chat rooms, join existing ones, and communicate in real-time with typing indicators and user presence notifications.

## ✨ Features

- **Real-Time Messaging**: Instant message delivery using Socket.IO
- **Multiple Chat Rooms**: Create and join different chat rooms
- **User Presence**: See who's online in each room
- **Typing Indicators**: Know when someone is typing
- **System Notifications**: Join/leave messages for all room members
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **User-Friendly Interface**: Clean and intuitive UI
- **No Database Required**: In-memory storage (perfect for development)

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with animations
- **Vanilla JavaScript** - Client-side logic
- **Socket.IO Client** - WebSocket client

## 📋 Requirements

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### 1. Navigate to the project directory
```bash
cd c:\Projects\chat-application
```

### 2. Install dependencies
```bash
npm install
```

This will install:
- express (web framework)
- socket.io (real-time communication)
- cors (cross-origin support)
- nodemon (auto-restart on file changes)

### 3. Start the server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🚀 Chat Server Running
📍 Server is listening on http://localhost:3000
🔌 Socket.IO ready for connections
```

### 4. Open in browser
Visit: **http://localhost:3000** in your web browser

## 💬 How to Use

### Join a Chat Room
1. Enter your **username** (max 20 characters)
2. Enter a **room name** (e.g., "general", "tech", "gaming")
3. Click **"Join Chat"**
4. Start messaging!

### Messaging
- Type your message in the input field
- Press **Enter** or click **"Send"** to send
- Your messages appear on the right in blue
- Other users' messages appear on the left in gray

### Features in Action
- **Typing Indicator**: When someone types, you'll see "User is typing..."
- **User List**: See all active users in the sidebar
- **Online Count**: Check how many users are online
- **System Messages**: Get notified when users join/leave
- **Leave Room**: Click "Leave Room" to disconnect

## 📁 Project Structure

```
chat-application/
├── server.js                 # Backend server (Express + Socket.IO)
├── package.json             # Project dependencies
├── public/
│   ├── index.html          # Frontend HTML structure
│   ├── style.css           # Styling and layout
│   └── script.js           # Frontend JavaScript logic
└── README.md               # This file
```

## 🔌 Socket.IO Events

### Client → Server
- **`join`** - User joins a room
- **`sendMessage`** - User sends a message
- **`typing`** - User starts typing
- **`stopTyping`** - User stops typing

### Server → Client
- **`userJoined`** - A user joined the room
- **`receiveMessage`** - Receive a message
- **`userTyping`** - Someone is typing
- **`userStoppedTyping`** - Someone stopped typing
- **`userLeft`** - A user left the room
- **`error`** - Error occurred

## 🌐 REST API Endpoints

### Get all active rooms
```
GET /api/rooms
```
Response:
```json
[
  {
    "name": "general",
    "userCount": 3,
    "users": ["Alice", "Bob", "Charlie"]
  }
]
```

### Get users in a specific room
```
GET /api/users/:room
```
Example: `GET /api/users/general`

Response:
```json
{
  "room": "general",
  "userCount": 3,
  "users": ["Alice", "Bob", "Charlie"]
}
```

## 🎨 Customization

### Change Server Port
Edit `server.js` and change:
```javascript
const PORT = process.env.PORT || 3000;
```

Or set environment variable:
```bash
set PORT=8080  # Windows
npm start
```

### Modify Colors
Edit `public/style.css` and update CSS variables:
```css
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    /* ... */
}
```

### Customize Features
All client-side logic is in `public/script.js` and backend logic is in `server.js` - easy to modify and extend!

## 🚀 Advanced Features (Ready to Implement)

The foundation is ready for:
- ✅ User authentication with JWT
- ✅ Message persistence with MongoDB/PostgreSQL
- ✅ Direct messaging between users
- ✅ Message search and history
- ✅ File/image sharing
- ✅ User profiles and avatars
- ✅ Message reactions and emojis
- ✅ Voice/video calling
- ✅ Admin controls and moderation

## 🐛 Troubleshooting

### Port already in use
```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
set PORT=3001
npm start
```

### Cannot connect to server
- Ensure the server is running
- Check if firewall is blocking port 3000
- Try refreshing the browser
- Check browser console (F12) for errors

### Messages not sending
- Make sure you're connected to the room
- Check browser console for errors
- Verify Socket.IO is loaded (check Network tab)

## 📝 Example Usage

```bash
# Terminal 1: Start the server
npm start

# Terminal 2+: Open browser tabs and navigate to http://localhost:3000
# User 1: Join room "gaming" as "Alice"
# User 2: Join room "gaming" as "Bob"
# Both can now chat in real-time!
```

## 📄 License

MIT License - Feel free to use this project for learning and development!

## 🤝 Contributing

Feel free to fork, modify, and improve this application!

## 💡 Tips & Best Practices

1. **Room Names**: Use lowercase, no spaces (e.g., "web-dev" instead of "Web Dev")
2. **Usernames**: Keep them short and unique for better UX
3. **Multiple Rooms**: Open multiple browser windows/tabs to test with different users
4. **Mobile Testing**: Use Chrome DevTools device emulation to test responsiveness
5. **Development**: Use `npm run dev` for faster development with auto-restart

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the console (F12) for error messages
3. Ensure Node.js and npm are properly installed

---

**Happy Chatting! 💬**
