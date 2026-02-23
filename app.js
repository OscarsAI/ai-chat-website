// AI Chat Website - JavaScript Logic

// DOM 元素
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelector = document.getElementById('modelSelector');
const modelDropdown = document.getElementById('modelDropdown');
const currentModelEl = document.getElementById('currentModel');
const clearBtn = document.getElementById('clearBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const loadingIndicator = document.getElementById('loadingIndicator');
const tokenCountEl = document.getElementById('tokenCount');

// 设置相关元素
const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const systemPromptInput = document.getElementById('systemPrompt');
const saveSettingsCheck = document.getElementById('saveSettings');

// 状态
let currentModel = 'MiniMax-M2.1';
let messages = [];
let totalTokens = 0;

// API配置
let apiConfig = {
    url: 'https://api.minimaxi.com/v1/chat/completions',
    key: '',
    systemPrompt: '你是一个有帮助的AI助手。'
};

// 模型配置
const modelConfigs = {
    'MiniMax-M2.1': {
        url: 'https://api.minimaxi.com/v1/chat/completions',
        name: 'MiniMax M2.1'
    },
    'deepseek-chat': {
        url: 'https://api.deepseek.com/v1/chat/completions',
        name: 'DeepSeek Chat'
    },
    'deepseek-reasoner': {
        url: 'https://api.deepseek.com/v1/chat/completions',
        name: 'DeepSeek Reasoner'
    },
    'MiniMax-M2.1-lightning': {
        url: 'https://api.minimaxi.com/v1/chat/completions',
        name: 'MiniMax Lightning'
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    loadChatHistory();
});

// 事件监听器设置
function setupEventListeners() {
    // 发送按钮
    sendBtn.addEventListener('click', sendMessage);
    
    // 输入框事件
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 自动调整输入框高度
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });
    
    // 模型选择器
    modelSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        modelDropdown.classList.toggle('show');
    });
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', () => {
        modelDropdown.classList.remove('show');
    });
    
    // 模型选项点击
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', () => {
            selectModel(option.dataset.model);
        });
    });
    
    // 建议按钮
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.dataset.text;
            messageInput.value = text;
            sendMessage();
        });
    });
    
    // 清空对话
    clearBtn.addEventListener('click', clearChat);
    
    // 设置按钮
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    // 保存设置
    saveSettings.addEventListener('click', () => {
        saveApiSettings();
        settingsModal.classList.remove('show');
    });
}

// 选择模型
function selectModel(modelId) {
    currentModel = modelId;
    const config = modelConfigs[modelId];
    currentModelEl.textContent = config.name;
    
    // 更新API URL
    apiConfig.url = config.url;
    
    // 更新选择状态
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.model === modelId);
    });
    
    modelDropdown.classList.remove('show');
}

// 发送消息
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;
    
    // 显示用户消息
    addMessage('user', text);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // 显示加载动画
    loadingIndicator.classList.add('show');
    sendBtn.disabled = true;
    
    try {
        // 调用API
        const response = await callAI(text);
        
        // 隐藏加载动画
        loadingIndicator.classList.remove('show');
        
        // 显示AI回复
        if (response.ok) {
            const data = await response.json();
            const aiMessage = data.choices[0].message.content;
            addMessage('ai', aiMessage);
            
            // 更新token计数
            if (data.usage) {
                totalTokens += data.usage.total_tokens;
                tokenCountEl.textContent = `${totalTokens} tokens`;
            }
        } else {
            const errorText = await response.text();
            addMessage('ai', `抱歉，出现了错误：\n${errorText}`);
        }
    } catch (error) {
        loadingIndicator.classList.remove('show');
        addMessage('ai', `网络错误：${error.message}`);
    }
    
    sendBtn.disabled = false;
}

// 调用AI API
async function callAI(userMessage) {
    const messages = [
        ...(apiConfig.systemPrompt ? [{ role: 'system', content: apiConfig.systemPrompt }] : []),
        ...getChatMessages(),
        { role: 'user', content: userMessage }
    ];
    
    // 确定模型ID
    let modelId = currentModel;
    if (currentModel === 'MiniMax-M2.1') modelId = 'abab6.5s-chat';
    if (currentModel === 'MiniMax-M2.1-lightning') modelId = 'abab5.5s-chat';
    
    return fetch(apiConfig.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.key}`
        },
        body: JSON.stringify({
            model: modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
        })
    });
}

// 获取聊天消息（用于API调用）
function getChatMessages() {
    return messages.filter(m => !m.isIntro).map(m => ({
        role: m.role,
        content: m.content
    }));
}

// 添加消息到界面
function addMessage(role, content) {
    // 隐藏欢迎消息
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'none';
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    
    const avatar = role === 'user' ? '😊' : '🤖';
    
    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;
    
    chatContainer.appendChild(messageEl);
    
    // 保存到消息列表
    messages.push({
        role: role,
        content: content,
        isIntro: false
    });
    
    // 滚动到底部
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // 保存到本地存储
    saveChatHistory();
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 清空对话
function clearChat() {
    if (confirm('确定要清空所有对话吗？')) {
        messages = [];
        chatContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">👻</div>
                <h2>你好！我是 AI 助手</h2>
                <p>有什么我可以帮你的吗？你可以问我问题、聊天、或者请求帮助。</p>
                <div class="suggestions">
                    <button class="suggestion-btn" data-text="给我讲个笑话">😄 讲个笑话</button>
                    <button class="suggestion-btn" data-text="今天天气怎么样">🌤️ 天气查询</button>
                    <button class="suggestion-btn" data-text="帮我写一首诗">✍️ 写一首诗</button>
                    <button class="suggestion-btn" data-text="介绍你自己">👋 自我介绍</button>
                </div>
            </div>
        `;
        localStorage.removeItem('ai-chat-history');
        totalTokens = 0;
        tokenCountEl.textContent = '0 tokens';
    }
}

// 保存聊天历史
function saveChatHistory() {
    const data = {
        messages: messages,
        totalTokens: totalTokens
    };
    localStorage.setItem('ai-chat-history', JSON.stringify(data));
}

// 加载聊天历史
function loadChatHistory() {
    const saved = localStorage.getItem('ai-chat-history');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            messages = data.messages || [];
            totalTokens = data.totalTokens || 0;
            tokenCountEl.textContent = `${totalTokens} tokens`;
            
            // 重新显示消息
            messages.forEach(msg => {
                if (!msg.isIntro) {
                    addMessage(msg.role, msg.content);
                }
            });
        } catch (e) {
            console.error('加载聊天历史失败:', e);
        }
    }
}

// 保存API设置
function saveApiSettings() {
    apiConfig.url = apiUrlInput.value || modelConfigs[currentModel].url;
    apiConfig.key = apiKeyInput.value;
    apiConfig.systemPrompt = systemPromptInput.value;
    
    if (saveSettingsCheck.checked) {
        localStorage.setItem('ai-chat-api-config', JSON.stringify(apiConfig));
    }
}

// 加载设置
function loadSettings() {
    // 加载API配置
    const savedConfig = localStorage.getItem('ai-chat-api-config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            apiConfig = { ...apiConfig, ...config };
            apiUrlInput.value = apiConfig.url;
            apiKeyInput.value = apiConfig.key;
            systemPromptInput.value = apiConfig.systemPrompt;
            saveSettingsCheck.checked = true;
        } catch (e) {
            console.error('加载API配置失败:', e);
        }
    }
    
    // 加载选中的模型
    const savedModel = localStorage.getItem('ai-chat-model');
    if (savedModel && modelConfigs[savedModel]) {
        selectModel(savedModel);
    }
}

// 保存当前模型选择
document.querySelectorAll('.model-option').forEach(option => {
    option.addEventListener('click', () => {
        localStorage.setItem('ai-chat-model', option.dataset.model);
    });
});