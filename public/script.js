// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const usersList = document.getElementById('usersList');
const currentRoomDisplay = document.getElementById('currentRoom');
const userCountDisplay = document.getElementById('userCount');
const roomTitleDisplay = document.getElementById('roomTitle');
const typingIndicator = document.getElementById('typingIndicator');
const typingUserDisplay = document.getElementById('typingUser');
const loginError = document.getElementById('loginError');

// New Elements
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const emojiBtn = document.getElementById('emojiBtn');
const emojiModal = document.getElementById('emojiModal');
const profileModal = document.getElementById('profileModal');
const emojiBtns = document.querySelectorAll('.emoji-btn');
const modalCloses = document.querySelectorAll('.modal-close');
const appContainer = document.getElementById('appContainer');

// State variables
let currentUser = null;
let currentRoom = null;
let isTyping = false;
let typingTimeout = null;
let messageReactions = {}; // Store reactions
let allMessages = []; // Store all messages for search
let userProfiles = {}; // Store user profiles
let selectedMessageId = null; // For reactions

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('chatTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('chatTheme', isDark ? 'dark' : 'light');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
}

// Event Listeners
if (joinBtn) joinBtn.addEventListener('click', handleJoin);
if (leaveBtn) leaveBtn.addEventListener('click', handleLeave);
if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSendMessage();
    });
    messageInput.addEventListener('input', handleTyping);
}
if (searchInput) searchInput.addEventListener('input', handleSearch);
if (emojiBtn && emojiModal) {
    emojiBtn.addEventListener('click', () => {
        emojiModal.style.display = emojiModal.style.display === 'none' ? 'block' : 'none';
    });
}

emojiBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const emoji = e.target.dataset.emoji;
        console.log('Emoji clicked:', emoji, 'MessageID:', selectedMessageId);
        if (selectedMessageId) {
            console.log('Emitting reaction:', { messageId: selectedMessageId, emoji: emoji });
            socket.emit('addReaction', {
                messageId: selectedMessageId,
                emoji: emoji
            });
            emojiModal.style.display = 'none';
            selectedMessageId = null;
        } else {
            console.warn('No message selected for reaction');
        }
    });
});

modalCloses.forEach(close => {
    close.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    if (event.target === emojiModal) {
        emojiModal.style.display = 'none';
    }
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
});

// Join chat room
function handleJoin() {
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();

    if (!username) {
        showLoginError('Please enter a username');
        return;
    }

    if (!room) {
        showLoginError('Please enter a room name');
        return;
    }

    currentUser = username;
    currentRoom = room;

    // Emit join event to server
    socket.emit('join', { username, room });

    // Clear error message
    loginError.style.display = 'none';

    // Switch screens
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');

    // Update UI
    currentRoomDisplay.textContent = room;
    roomTitleDisplay.textContent = `#${room}`;

    // Focus on message input
    messageInput.focus();

    // Clear inputs
    usernameInput.value = '';
    roomInput.value = '';
}

// Leave chat room
function handleLeave() {
    if (confirm('Are you sure you want to leave the chat?')) {
        socket.disconnect();
        loginScreen.classList.add('active');
        chatScreen.classList.remove('active');
        messagesContainer.innerHTML = '<div class="welcome-message"><p>👋 Welcome to the chat! Start messaging...</p></div>';
        usersList.innerHTML = '';
        currentUser = null;
        currentRoom = null;
    }
}

// Send message with slash command support
function handleSendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    // Handle slash commands
    if (message.startsWith('/')) {
        handleSlashCommand(message);
        messageInput.value = '';
        return;
    }

    // Send regular message
    socket.emit('sendMessage', { message });
    messageInput.value = '';
    socket.emit('stopTyping');
    isTyping = false;
    messageInput.focus();
}

// Slash commands handler
function handleSlashCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();

    switch(cmd) {
        case '/help':
            showSystemMessage(`
                <strong>Available Commands:</strong><br>
                /users - List online users<br>
                /clear - Clear messages<br>
                /joke - Random joke<br>
                /time - Current time<br>
                /help - Show this help
            `);
            break;
        case '/users':
            const users = Array.from(usersList.querySelectorAll('li')).map(li => li.textContent);
            showSystemMessage(`Online users: ${users.join(', ')}`);
            break;
        case '/clear':
            messagesContainer.innerHTML = '';
            allMessages = [];
            showSystemMessage('Messages cleared');
            break;
        case '/joke':
            fetch('https://official-joke-api.appspot.com/random_joke')
                .then(r => r.json())
                .then(data => {
                    showSystemMessage(`${data.setup} <br> ${data.punchline}`);
                })
                .catch(() => showSystemMessage('Could not fetch joke'));
            break;
        case '/time':
            const time = new Date().toLocaleTimeString();
            showSystemMessage(`Current time: ${time}`);
            break;
        default:
            showSystemMessage(`Unknown command: ${cmd}`);
    }
}

// Handle typing indicator
function handleTyping() {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing');

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            socket.emit('stopTyping');
        }, 3000);
    }
}

// Search messages
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const messages = document.querySelectorAll('.message');

    messages.forEach(msg => {
        const text = msg.textContent.toLowerCase();
        msg.style.opacity = query === '' || text.includes(query) ? '1' : '0.3';
    });
}

// Show login error
function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Socket.IO Event Handlers

socket.on('userJoined', (data) => {
    const { username, userCount, users, message } = data;

    updateUsersList(users);
    userCountDisplay.textContent = userCount;

    // Store user profile
    users.forEach(u => {
        if (!userProfiles[u.username]) {
            userProfiles[u.username] = {
                username: u.username,
                joined: new Date(),
                messages: 0,
                status: 'online'
            };
        }
    });

    if (username !== currentUser) {
        displaySystemMessage(`✅ ${message}`);
    }

    console.log(`${username} joined the room`);
});

socket.on('receiveMessage', (data) => {
    const { username, text, timestamp, userId } = data;
    const messageId = `${userId}-${timestamp}`;
    
    allMessages.push({ id: messageId, username, text, timestamp });
    
    // Update user profile message count
    if (userProfiles[username]) {
        userProfiles[username].messages++;
    }
    
    displayMessage(username, text, timestamp, userId === socket.id, messageId);
});

// User typing
socket.on('userTyping', (data) => {
    const { username } = data;
    typingUserDisplay.textContent = username;
    typingIndicator.style.display = 'block';
});

// User stopped typing
socket.on('userStoppedTyping', () => {
    typingIndicator.style.display = 'none';
});

// User left room
socket.on('userLeft', (data) => {
    const { username, userCount, users, message } = data;

    updateUsersList(users);
    userCountDisplay.textContent = userCount;
    displaySystemMessage(`👋 ${message}`);

    console.log(`${username} left the room`);
});

socket.on('addReaction', (data) => {
    const { messageId, username, emoji } = data;
    console.log('Reaction received:', { messageId, username, emoji });
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    console.log('Message element found:', !!messageElement);
    
    if (messageElement) {
        let reactionsDiv = messageElement.querySelector('.message-reactions');
        if (!reactionsDiv) {
            reactionsDiv = document.createElement('div');
            reactionsDiv.className = 'message-reactions';
            messageElement.appendChild(reactionsDiv);
        }

        let reactionBtn = reactionsDiv.querySelector(`[data-emoji="${emoji}"]`);
        if (!reactionBtn) {
            reactionBtn = document.createElement('div');
            reactionBtn.className = 'reaction';
            reactionBtn.dataset.emoji = emoji;
            reactionBtn.textContent = `${emoji} 1`;
            reactionBtn.addEventListener('click', () => {
                socket.emit('addReaction', { messageId, emoji });
            });
            reactionsDiv.appendChild(reactionBtn);
            console.log('New reaction added:', emoji);
        } else {
            const count = parseInt(reactionBtn.textContent.split(' ')[1]) + 1;
            reactionBtn.textContent = `${emoji} ${count}`;
            
            if (username === currentUser) {
                reactionBtn.classList.add('user-reacted');
            }
            console.log('Reaction count updated:', count);
        }
    } else {
        console.error('Message element not found for messageId:', messageId);
    }
});

// Error handling
socket.on('error', (error) => {
    console.error('Socket error:', error);
    showLoginError(error);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    showLoginError('Failed to connect to server. Please try again.');
});

// Helper Functions

function displayMessage(username, text, timestamp, isOwn = false, messageId = null) {
    // Remove welcome message if present
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : 'message-other'}`;
    if (messageId) messageDiv.dataset.messageId = messageId;

    // User avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = username.substring(0, 2).toUpperCase();
    avatar.style.backgroundColor = getColorForUser(username);
    avatar.style.cursor = 'pointer';
    avatar.addEventListener('click', () => showUserProfile(username));

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (!isOwn) {
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'message-username';
        usernameSpan.textContent = username;
        usernameSpan.style.cursor = 'pointer';
        usernameSpan.addEventListener('click', () => showUserProfile(username));
        contentDiv.appendChild(usernameSpan);
    }

    // Format message text (handle mentions, code, etc.)
    const formattedText = formatMessageText(text);
    contentDiv.innerHTML += formattedText;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'message-info';
    infoDiv.textContent = `${isOwn ? 'You' : username} • ${timestamp}`;

    messageDiv.appendChild(infoDiv);

    // Add reaction button
    const reactionBtnContainer = document.createElement('div');
    reactionBtnContainer.className = 'message-actions';
    const reactionAddBtn = document.createElement('button');
    reactionAddBtn.className = 'btn-reaction';
    reactionAddBtn.textContent = '+';
    reactionAddBtn.addEventListener('click', () => {
        console.log('+ button clicked, messageId:', messageId);
        selectedMessageId = messageId;
        emojiModal.style.display = 'block';
    });
    reactionBtnContainer.appendChild(reactionAddBtn);
    messageDiv.appendChild(reactionBtnContainer);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displaySystemMessage(text) {
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.innerHTML = text;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessageText(text) {
    // Handle @mentions
    text = text.replace(/@(\w+)/g, '<strong style="color: var(--primary-color);">@$1</strong>');
    
    // Handle code blocks
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle **bold**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle *italic*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    return text;
}

function getColorForUser(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function showUserProfile(username) {
    const profile = userProfiles[username];
    if (!profile) return;

    const profileAvatar = document.getElementById('profileAvatar');
    profileAvatar.textContent = username.substring(0, 2).toUpperCase();
    profileAvatar.style.backgroundColor = getColorForUser(username);

    document.getElementById('profileName').textContent = username;
    document.getElementById('profileStatus').textContent = `${profile.status} • in #${currentRoom}`;
    
    const profileTimeEl = document.getElementById('profileTime');
    if (profileTimeEl) profileTimeEl.textContent = `Joined ${formatTime(profile.joined)}`;
    
    const profileMessagesEl = document.getElementById('profileMessages');
    if (profileMessagesEl) profileMessagesEl.textContent = profile.messages;
    
    const profileJoinedEl = document.getElementById('profileJoined');
    if (profileJoinedEl) profileJoinedEl.textContent = formatDate(profile.joined);

    profileModal.style.display = 'block';
}

function formatTime(date) {
    const diff = Date.now() - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return formatDate(date);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function updateUsersList(users) {
    usersList.innerHTML = '';

    if (!users || users.length === 0) {
        usersList.innerHTML = '<li>No users in this room</li>';
        return;
    }

    users.forEach(user => {
        const li = document.createElement('li');
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar-small';
        avatar.textContent = user.username.substring(0, 2).toUpperCase();
        avatar.style.backgroundColor = getColorForUser(user.username);
        
        const name = document.createElement('span');
        name.textContent = user.username;
        name.style.cursor = 'pointer';
        name.addEventListener('click', () => showUserProfile(user.username));
        
        li.appendChild(avatar);
        li.appendChild(name);
        
        if (user.username === currentUser) {
            li.textContent += ' (you)';
            li.style.fontWeight = 'bold';
        }
        usersList.appendChild(li);
    });
}

// Connection feedback
socket.on('connect', () => {
    console.log('✅ Connected to server');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
});

// Auto-focus on message input
document.addEventListener('keydown', (e) => {
    if (chatScreen.classList.contains('active') && e.key !== 'Enter' && e.key !== 'Shift') {
        if (!emojiModal.style.display || emojiModal.style.display === 'none') {
            messageInput.focus();
        }
    }
});

// Initialize theme on load
window.addEventListener('DOMContentLoaded', initTheme);
