// Global variables
let socket = null;
let currentUser = null;
let currentFriend = null;
let jwtToken = null;

// API Base URLs
const AUTH_API = 'http://localhost:3001';
const USER_API = 'http://localhost:3002';
const CHAT_API = 'http://localhost:3003';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('jwtToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        jwtToken = savedToken;
        currentUser = savedUser;
        showChatInterface();
        connectToChat();
        loadFriends();
        loadFriendRequests();
    }
    
    // Add enter key listeners
    document.getElementById('usernameOrEmail').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('regUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    
    document.getElementById('regPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});

// Authentication functions
async function login() {
    const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!usernameOrEmail || !password) {
        showError('loginError', 'Please enter both username/email and password');
        return;
    }
    
    try {
        const response = await fetch(`${AUTH_API}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usernameOrEmail, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            jwtToken = data.data.token;
            currentUser = data.data.user.username;
            
            // Save to localStorage
            localStorage.setItem('jwtToken', jwtToken);
            localStorage.setItem('currentUser', currentUser);
            
            showSuccess('loginSuccess', 'Login successful!');
            setTimeout(() => {
                showChatInterface();
                connectToChat();
                loadFriends();
                loadFriendRequests();
            }, 1000);
        } else {
            showError('loginError', data.message || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'Connection error. Please try again.');
        console.error('Login error:', error);
    }
}

async function register() {
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const dateOfBirth = document.getElementById('regDateOfBirth').value;
    const password = document.getElementById('regPassword').value.trim();
    const avatarFile = document.getElementById('regAvatar').files[0];
    
    if (!fullName || !username || !email || !dateOfBirth || !password) {
        showError('registerError', 'Please fill in all required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        showError('registerError', 'Please enter a valid email address');
        return;
    }
    
    // Validate date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
        showError('registerError', 'You must be at least 13 years old to register');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters long');
        return;
    }
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('fullName', fullName);
        formData.append('dateOfBirth', dateOfBirth);
        
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        const response = await fetch(`${AUTH_API}/auth/register`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('registerSuccess', 'Registration successful! Please login.');
            setTimeout(() => {
                showLogin();
                document.getElementById('username').value = username;
            }, 1500);
        } else {
            showError('registerError', data.message || 'Registration failed');
        }
    } catch (error) {
        showError('registerError', 'Connection error. Please try again.');
        console.error('Registration error:', error);
    }
}

function logout() {
    // Disconnect socket
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    
    // Clear stored data
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    
    // Reset variables
    jwtToken = null;
    currentUser = null;
    currentFriend = null;
    
    // Show login screen
    showLogin();
}

// UI functions
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('chatInterface').classList.add('hidden');
    clearMessages();
}

function showRegister() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.remove('hidden');
    document.getElementById('chatInterface').classList.add('hidden');
    clearMessages();
}

function showChatInterface() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('registerScreen').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    document.getElementById('currentUser').textContent = currentUser;
}

// Preview avatar function
function previewAvatar() {
    const fileInput = document.getElementById('regAvatar');
    const preview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('avatarPreviewImg');
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.classList.remove('hidden');
        };
        
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        preview.classList.add('hidden');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        successElement.classList.add('hidden');
    }, 3000);
}

function clearMessages() {
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginSuccess').classList.add('hidden');
    document.getElementById('registerError').classList.add('hidden');
    document.getElementById('registerSuccess').classList.add('hidden');
}

// Socket.io functions
function connectToChat() {
    if (!jwtToken) {
        console.error('No JWT token available');
        return;
    }
    
    if (socket) {
        socket.disconnect();
    }
    
    socket = io('http://localhost:3003', {
        auth: { token: jwtToken }
    });
    
    socket.on('connect', () => {
        updateStatus('Connected', 'connected');
        console.log('Connected to chat service');
    });
    
    socket.on('disconnect', () => {
        updateStatus('Disconnected', 'disconnected');
        console.log('Disconnected from chat service');
    });
    
    socket.on('error', (error) => {
        updateStatus('Error: ' + error.message, 'disconnected');
        console.error('Socket error:', error);
    });
    
    socket.on('connected', (data) => {
        console.log('Chat service connected:', data);
    });
    
    socket.on('new_message', (data) => {
        addMessage(data.message, data.sender, 'received', data.timestamp);
    });
    
    socket.on('message_sent', (data) => {
        addMessage(data.message, data.sender, 'sent', data.timestamp);
    });
    
    socket.on('joined_chat', (data) => {
        console.log('Joined chat:', data);
        updateChatTitle(`Chat with ${data.friend}`);
    });
    
    socket.on('user_typing', (data) => {
        showTypingIndicator(`${data.sender} is typing...`);
    });
    
    socket.on('user_stop_typing', (data) => {
        hideTypingIndicator();
    });
}

// User management functions
async function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.trim();
    if (!searchTerm) {
        showSearchError('Please enter a username to search');
        return;
    }
    
    try {
        const response = await fetch(`${USER_API}/users/search?username=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.data);
        } else {
            showSearchError('Search failed: ' + data.message);
        }
    } catch (error) {
        showSearchError('Search error: ' + error.message);
        console.error('Search error:', error);
    }
}

// Display search results
function displaySearchResults(users) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (users.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-info">No users found</div></div>';
        return;
    }
    
    users.forEach(user => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result-item';
        resultDiv.innerHTML = `
            <div class="search-result-info">
                <div class="search-result-username">${user.username}</div>
                <div class="search-result-date">Joined: ${new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="search-result-actions">
                <button class="btn-send-request" onclick="sendFriendRequest('${user.username}')">Send Request</button>
            </div>
        `;
        searchResults.appendChild(resultDiv);
    });
}

// Show search error
function showSearchError(message) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `<div class="search-result-item"><div class="search-result-info" style="color: #dc3545;">${message}</div></div>`;
}

// Send friend request from search results
async function sendFriendRequest(username) {
    try {
        const response = await fetch(`${USER_API}/users/add-friend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Friend request sent to ${username}!`);
            // Update button to show cancel option
            const buttons = document.querySelectorAll(`button[onclick="sendFriendRequest('${username}')"]`);
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = 'Cancel Request';
                btn.onclick = () => cancelFriendRequest(username);
                btn.className = 'btn-cancel-request';
            });
        } else {
            alert('Failed to send friend request: ' + data.message);
        }
    } catch (error) {
        alert('Error sending friend request: ' + error.message);
        console.error('Send friend request error:', error);
    }
}

// Cancel friend request
async function cancelFriendRequest(username) {
    try {
        const response = await fetch(`${USER_API}/users/cancel-friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Friend request to ${username} cancelled!`);
            // Update button back to send request
            const buttons = document.querySelectorAll(`button[onclick="cancelFriendRequest('${username}')"]`);
            buttons.forEach(btn => {
                btn.textContent = 'Send Request';
                btn.onclick = () => sendFriendRequest(username);
                btn.className = 'btn-send-request';
            });
        } else {
            alert('Failed to cancel friend request: ' + data.message);
        }
    } catch (error) {
        alert('Error cancelling friend request: ' + error.message);
        console.error('Cancel friend request error:', error);
    }
}


// Load friend requests
async function loadFriendRequests() {
    try {
        const response = await fetch(`${USER_API}/users/friend-requests`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayFriendRequests(data.data);
        } else {
            console.error('Failed to load friend requests:', data.message);
        }
    } catch (error) {
        console.error('Load friend requests error:', error);
    }
}

// Display friend requests
function displayFriendRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';
    
    if (requests.length === 0) {
        requestsList.innerHTML = '<p style="color: #666; font-style: italic;">No pending requests</p>';
        return;
    }
    
    requests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.className = 'request-item';
        requestDiv.innerHTML = `
            <div class="request-info">
                <div class="request-username">${request.from}</div>
                <div style="font-size: 12px; color: #666;">wants to be your friend</div>
            </div>
            <div class="request-actions">
                <button class="btn-accept" onclick="acceptFriendRequest('${request.from}')">Accept</button>
                <button class="btn-decline" onclick="declineFriendRequest('${request.from}')">Decline</button>
            </div>
        `;
        requestsList.appendChild(requestDiv);
    });
}

// Accept friend request
async function acceptFriendRequest(username) {
    try {
        const response = await fetch(`${USER_API}/users/accept-friend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`You are now friends with ${username}!`);
            loadFriendRequests(); // Reload requests
            loadFriends(); // Reload friends list
        } else {
            alert(data.message || 'Failed to accept friend request');
        }
    } catch (error) {
        console.error('Accept friend request error:', error);
        alert('Connection error. Please try again.');
    }
}

// Decline friend request
async function declineFriendRequest(username) {
    try {
        const response = await fetch(`${USER_API}/users/decline-friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Friend request from ${username} declined`);
            loadFriendRequests(); // Reload requests
        } else {
            alert('Failed to decline friend request: ' + data.message);
        }
    } catch (error) {
        console.error('Decline friend request error:', error);
        alert('Connection error. Please try again.');
    }
}

async function loadFriends() {
    try {
        const response = await fetch(`${USER_API}/users/friends`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayFriends(data.data);
        } else {
            console.error('Failed to load friends:', data.message);
        }
    } catch (error) {
        console.error('Load friends error:', error);
    }
}

function displayFriends(friends) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '<h4>Friends</h4>';
    
    if (friends.length === 0) {
        friendsList.innerHTML += '<p style="color: #666; text-align: center; margin-top: 20px;">No friends yet</p>';
        return;
    }
    
    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        friendElement.innerHTML = `
            <div class="friend-avatar">${friend.username.charAt(0).toUpperCase()}</div>
            <div class="friend-info">
                <div class="friend-name">${friend.username}</div>
                <div class="friend-status">Online</div>
            </div>
        `;
        
        friendElement.addEventListener('click', () => {
            selectFriend(friend.username);
        });
        
        friendsList.appendChild(friendElement);
    });
}

function selectFriend(username) {
    // Update UI
    document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Set current friend
    currentFriend = username;
    updateChatTitle(`Chat with ${username}`);
    
    // Enable chat input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    
    // Join chat room
    if (socket) {
        socket.emit('join_chat', { friendUsername: username });
    }
    
    // Load chat history
    loadChatHistory(username);
}

async function loadChatHistory(friendUsername) {
    try {
        const response = await fetch(`${API_BASE}/chat/history/${friendUsername}`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const messages = data.data.messages;
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            
            if (messages.length === 0) {
                chatMessages.innerHTML = '<div style="text-align: center; color: #666; margin-top: 50px;"><p>No messages yet. Start the conversation!</p></div>';
                return;
            }
            
            messages.forEach(message => {
                addMessage(message.message, message.sender, 
                    message.sender === currentUser ? 'sent' : 'received', 
                    message.timestamp);
            });
        }
    } catch (error) {
        console.error('Load chat history error:', error);
    }
}

// Chat functions
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentFriend) {
        return;
    }
    
    if (!socket) {
        alert('Not connected to chat service');
        return;
    }
    
    socket.emit('send_message', {
        receiver: currentFriend,
        message: message
    });
    
    messageInput.value = '';
}

function addMessage(message, sender, type, timestamp) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Clear welcome message if it exists
    if (chatMessages.children.length === 1 && chatMessages.children[0].style.textAlign === 'center') {
        chatMessages.innerHTML = '';
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const time = new Date(timestamp).toLocaleTimeString();
    messageElement.innerHTML = `
        <div>${message}</div>
        <div class="message-info">${sender} - ${time}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateStatus(message, type) {
    const statusElement = document.getElementById('statusIndicator');
    statusElement.textContent = message;
    statusElement.className = `status-indicator ${type}`;
}

function updateChatTitle(title) {
    document.getElementById('chatTitle').textContent = title;
}

function showTypingIndicator(text) {
    const indicator = document.getElementById('typingIndicator');
    indicator.textContent = text;
    indicator.classList.remove('hidden');
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.add('hidden');
}

