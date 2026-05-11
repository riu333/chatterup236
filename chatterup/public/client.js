const socket = io(); // Connect to the server

let userName = '';
let profilePic = '';
let isTyping = false;
let typingTimeout;

// Elements
const onboardingModal = document.getElementById('onboardingModal');
const startChatBtn = document.getElementById('startChatBtn');
const usernameInput = document.getElementById('usernameInput');
const chatContainer = document.getElementById('chatContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const chatBox = document.getElementById('chatBox');
const typingIndicator = document.getElementById('typingIndicator');
const userList = document.getElementById('userList');

// Step 1: Handle user onboarding
startChatBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (!name) return;

  userName = name;
  socket.emit('new-user', name); // Tell server a new user joined
  onboardingModal.style.display = 'none';
  chatContainer.classList.remove('hidden');
  welcomeMessage.textContent = `Welcome, ${userName}!`;
});

// Step 2: Send chat messages
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (!msg) return;

  socket.emit('chat-message', msg);
  messageInput.value = '';
  stopTyping();
});

// Step 3: Handle typing indicator
messageInput.addEventListener('input', () => {
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing');
  }

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    stopTyping();
  }, 1000);
});

function stopTyping() {
  if (isTyping) {
    socket.emit('stop-typing');
    isTyping = false;
  }
}

// Step 4: Receive chat messages
socket.on('chat-message', (data) => {
  addMessage(data);
});
console.log("Chat message received:", data);


function addMessage({ userName, profilePic, content, timestamp }) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  messageDiv.innerHTML = `
    <div style="display: flex; align-items: center;">
      <img src="${profilePic}" alt="pic" width="30" style="border-radius: 50%; margin-right: 8px;">
      <strong>${userName}</strong> <span style="margin-left: auto; font-size: 12px; color: gray;">${time}</span>
    </div>
    <p>${content}</p>
  `;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Step 5: Typing indicator display
socket.on('typing', (user) => {
  typingIndicator.textContent = `${user} is typing...`;
});

socket.on('stop-typing', () => {
  typingIndicator.textContent = '';
});

// Step 6: Update online user list
socket.on('user-list', (users) => {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span style="color: green; font-size: 1.2em;">●</span>
      <img src="${user.profilePic}" alt="pic" width="24" style="border-radius: 50%; margin-left: 5px; margin-right: 5px;">
      ${user.name}
    `;
    userList.appendChild(li);
  });
});
