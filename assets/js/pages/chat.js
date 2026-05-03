document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pdfPath = urlParams.get('path');
    const pdfTitle = urlParams.get('title') || 'PDF Document';

    if (!pdfPath) {
        showSystemMessage('Error: No PDF document specified.', true);
        return;
    }

    document.getElementById('pdf-title').textContent = `Chat: ${pdfTitle}`;
    
    // Initialize chatbot
    initChatbot(pdfPath);

    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const question = input.value.trim();
        if (!question) return;

        // Add user message to UI
        addMessage(question, 'user');
        input.value = '';
        
        // Disable input while waiting
        setFormState(false);
        
        // Show typing indicator
        const typingId = addTypingIndicator();

        try {
            const response = await fetch('/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: pdfPath, question: question })
            });

            const data = await response.json();
            
            // Remove typing indicator
            removeElement(typingId);

            if (data.success) {
                addMessage(data.answer, 'ai');
            } else {
                addMessage(`Error: ${data.message}`, 'ai');
            }
        } catch (error) {
            removeElement(typingId);
            addMessage('Failed to connect to the server. Please try again.', 'ai');
        }

        // Re-enable input
        setFormState(true);
    });
});

async function initChatbot(path) {
    try {
        const response = await fetch('/api/chat/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        const data = await response.json();

        const initMessageElem = document.getElementById('init-message');
        if (data.success) {
            initMessageElem.innerHTML = `<i class="fas fa-check-circle" style="color: #4CAF50;"></i> Document analyzed successfully! You can now ask questions.`;
            setFormState(true);
        } else {
            initMessageElem.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #f44336;"></i> Initialization failed: ${data.message}`;
        }
    } catch (error) {
        document.getElementById('init-message').innerHTML = `<i class="fas fa-exclamation-circle" style="color: #f44336;"></i> Server connection failed.`;
    }
}

function setFormState(enabled) {
    document.getElementById('chat-input').disabled = !enabled;
    document.getElementById('send-btn').disabled = !enabled;
    if (enabled) {
        document.getElementById('chat-input').focus();
    }
}

function addMessage(text, sender) {
    const box = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    // Simple markdown to HTML for AI messages (bold, newlines)
    let formattedText = text;
    if (sender === 'ai') {
        formattedText = formattedText
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\n/g, '<br>');
    }
    
    msgDiv.innerHTML = formattedText;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
}

function addTypingIndicator() {
    const box = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    msgDiv.id = id;
    msgDiv.className = `message ai-message`;
    msgDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generating answer...';
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
