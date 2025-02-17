let currentChatId = null;
let renameChatId = null;
let deleteChatId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    if (chats.length === 0) {
        createNewChat();
    } else {
        loadChatList();
        loadChatMessages(chats[chats.length - 1].id);
    }
});

// Chat List
function loadChatList() {
    const chatList = document.getElementById('chatList');
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `
            <span>${chat.title}</span>
            <div class="chat-actions">
                <button onclick="event.stopPropagation(); openRenameModal('${chat.id}')">✏️</button>
                <button onclick="event.stopPropagation(); deleteChat('${chat.id}')">🗑️</button>
            </div>
            <small>${chat.messages.length} messages</small>
        `;
        chatItem.addEventListener('click', () => switchChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

// Chat Management
function createNewChat() {
    const chatId = Date.now().toString();
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    const newChat = {
        id: chatId,
        title: `Untitled -${chats.length + 1}`,
        messages: [],
        created: new Date().toISOString()
    };
    
    chats.push(newChat);
    localStorage.setItem('chats', JSON.stringify(chats));
    switchChat(chatId);
    loadChatList();
}

function switchChat(chatId) {
    currentChatId = chatId;
    loadChatList();
    loadChatMessages(chatId);
}

// AI Integration
async function debugCode(code) {
    try {
        const response = await fetch('/api/debug', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) throw new Error('Debugging failed');
        return await response.json();
    } catch (error) {
        console.error('Debug error:', error);
        return { error: error.message };
    }
}

function addMessageToUI(text, className) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = text;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

function saveChatMessage(userInput, result) {
    const chats = JSON.parse(localStorage.getItem('chats'));
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    // Save user message
    chats[chatIndex].messages.push({
        text: userInput,
        sender: 'user-message',
        timestamp: new Date().toISOString()
    });
    
    // Save bot response
    chats[chatIndex].messages.push({
        text: result.error ? `Error: ${result.error}` : 
            `Diagnosis: ${result.diagnosis}\nFixed Code: ${result.fixed_code}`,
        sender: 'bot-message',
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('chats', JSON.stringify(chats));
    loadChatList();
}

function loadChatMessages(chatId) {
    const chats = JSON.parse(localStorage.getItem('chats'));
    const chat = chats.find(c => c.id === chatId);
    const chatContainer = document.getElementById('chatContainer');
    
    chatContainer.innerHTML = '';
    chat.messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;
        messageDiv.innerHTML = message.text; // Changed to innerHTML
        chatContainer.appendChild(messageDiv);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Rename Functions
function openRenameModal(chatId) {
    renameChatId = chatId;
    const chat = JSON.parse(localStorage.getItem('chats')).find(c => c.id === chatId);
    document.getElementById('renameInput').value = chat.title;
    document.getElementById('renameModal').style.display = 'flex';
    document.getElementById('renameInput').focus();
}

function closeRenameModal() {
    document.getElementById('renameModal').style.display = 'none';
    renameChatId = null;
}

function saveChatName() {
    const newName = document.getElementById('renameInput').value.trim();
    if (newName && renameChatId) {
        let chats = JSON.parse(localStorage.getItem('chats'));
        const chatIndex = chats.findIndex(c => c.id === renameChatId);
        if (chatIndex > -1) {
            chats[chatIndex].title = newName;
            localStorage.setItem('chats', JSON.stringify(chats));
            loadChatList();
        }
    }
    closeRenameModal();
}

// Delete Functions
function deleteChat(chatId) {
    deleteChatId = chatId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteChatId = null;
}

function confirmDelete() {
    if (!deleteChatId) return;

    let chats = JSON.parse(localStorage.getItem('chats'));
    chats = chats.filter(chat => chat.id !== deleteChatId);
    localStorage.setItem('chats', JSON.stringify(chats));

    if (currentChatId === deleteChatId) {
        chats.length > 0 ? switchChat(chats[0].id) : createNewChat();
    }
    loadChatList();
    closeDeleteModal();
}

// Message Handling
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const messageText = userInput.value.trim();
    
    if (!messageText) return;
    
    // Add user message
    addMessageToUI(messageText, 'user-message');
    userInput.value = '';
    
    try {
        // Show loading state
        const loadingMessage = addMessageToUI('🔍 Analyzing code...', 'bot-message loading-message');
        
        // Call debug API
        const result = await debugCode(messageText);
        
        // Remove loading message
        loadingMessage.remove();

        // Handle response
        if (result.error) {
            addMessageToUI(`❌ Error: ${result.error}`, 'bot-message error-message');
        } else {
            const formattedResponse = `
                <div class="code-header">🩺 Diagnosis:</div>
                <div>${result.diagnosis}</div>
                
                <div class="code-header" style="margin-top: 15px;">✅ Confidence:</div>
                <div>${result.confidence}%</div>
                
                <div class="code-header" style="margin-top: 15px;">🔧 Fixed Code:</div>
                <pre>${result.fixed_code}</pre>
            `;
            addMessageToUI(formattedResponse, 'bot-message');
        }
        
        // Save to local storage
        saveChatMessage(messageText, result);
        
    } catch (error) {
        addMessageToUI(`⚠️ Error: ${error.message}`, 'bot-message error-message');
    }
}

// Event Listeners
document.getElementById('userInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendMessage();
});