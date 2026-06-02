/**
 * 高标准农田AI政策助手 - 前端交互逻辑
 * 功能：悬浮球、聊天窗口、文件上传、Dify API 调用
 */

(function () {
  'use strict';

  // ==================== 配置 ====================
  const API_BASE = (window.ENV && window.ENV.DIFY_API_BASE) || 'https://api.dify.ai/v1';
  const API_KEY = (window.ENV && window.ENV.DIFY_API_KEY) || 'app-xxxxxxxxxxxxxxxxxxxx';
  const USER_ID = 'farm-policy-user-' + Date.now();

  // ==================== DOM 元素 ====================
  const floatingBtn = document.getElementById('floatingBtn');
  const chatPanel = document.getElementById('chatPanel');
  const chatHeader = document.getElementById('chatHeader');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');
  const fileTags = document.getElementById('fileTags');

  // ==================== 状态 ====================
  let isPanelOpen = false;
  let conversationId = '';        // 多轮对话 ID
  let pendingFiles = [];          // 待发送的文件对象 { name, id, file }
  let isSending = false;          // 防止重复发送

  // ==================== 悬浮球 & 面板开关 ====================
  floatingBtn.addEventListener('click', function () {
    if (isPanelOpen) return;
    openPanel();
  });

  chatCloseBtn.addEventListener('click', function () {
    closePanel();
  });

  function openPanel() {
    isPanelOpen = true;
    floatingBtn.classList.add('panel-open');
    chatPanel.classList.add('open');
    chatPanel.classList.remove('closing');
    chatInput.focus();
  }

  function closePanel() {
    isPanelOpen = false;
    chatPanel.classList.add('closing');
    chatPanel.classList.remove('open');
    // 等动画结束再隐藏悬浮球动画状态
    setTimeout(function () {
      chatPanel.classList.remove('closing');
      floatingBtn.classList.remove('panel-open');
    }, 300);
  }

  // ==================== 面板拖拽 ====================
  let isDragging = false;
  let dragStartX, dragStartY, panelStartX, panelStartY;

  chatHeader.addEventListener('mousedown', function (e) {
    if (e.target === chatCloseBtn || chatCloseBtn.contains(e.target)) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    var rect = chatPanel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    chatPanel.style.transition = 'none';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    chatPanel.style.left = (panelStartX + dx) + 'px';
    chatPanel.style.top = (panelStartY + dy) + 'px';
    chatPanel.style.right = 'auto';
    chatPanel.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      chatPanel.style.transition = '';
      document.body.style.userSelect = '';
    }
  });

  // ==================== 文件上传 ====================
  attachBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var files = fileInput.files;
    for (var i = 0; i < files.length; i++) {
      addFileTag(files[i]);
    }
    fileInput.value = '';
  });

  function addFileTag(file) {
    // 检查是否已存在
    for (var i = 0; i < pendingFiles.length; i++) {
      if (pendingFiles[i].file.name === file.name && pendingFiles[i].file.size === file.size) {
        return;
      }
    }
    pendingFiles.push({ name: file.name, id: null, file: file });
    renderFileTags();
  }

  function removeFileTag(index) {
    pendingFiles.splice(index, 1);
    renderFileTags();
  }

  function renderFileTags() {
    fileTags.innerHTML = '';
    if (pendingFiles.length === 0) {
      fileTags.style.display = 'none';
      return;
    }
    fileTags.style.display = 'flex';
    pendingFiles.forEach(function (item, index) {
      var tag = document.createElement('span');
      tag.className = 'file-tag';
      tag.innerHTML =
        '<span class="file-tag-name" title="' + escapeHtml(item.name) + '">📎 ' + escapeHtml(item.name) + '</span>' +
        '<button class="file-tag-remove" data-index="' + index + '" title="移除">&times;</button>';
      tag.querySelector('.file-tag-remove').addEventListener('click', function () {
        removeFileTag(parseInt(this.getAttribute('data-index'), 10));
      });
      fileTags.appendChild(tag);
    });
  }

  // ==================== 消息渲染 ====================
  function addMessage(role, content, isError) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + role;
    var avatarEmoji = role === 'user' ? '👤' : '🌾';
    msgDiv.innerHTML = '<div class="avatar">' + avatarEmoji + '</div>' +
      '<div class="bubble' + (isError ? ' error-bubble' : '') + '">' +
      (role === 'assistant' ? renderMarkdown(content) : '<p>' + escapeHtml(content) + '</p>') +
      '</div>';
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
  }

  function addLoadingMessage() {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'message assistant';
    msgDiv.id = 'loadingMessage';
    msgDiv.innerHTML = '<div class="avatar">🌾</div>' +
      '<div class="bubble"><div class="typing-indicator"><span></span><span></span><span></span></div><p style="color:var(--gray-500);font-size:13px;">正在查询政策...</p></div>';
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv;
  }

  function removeLoadingMessage() {
    var el = document.getElementById('loadingMessage');
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function renderMarkdown(text) {
    try {
      if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(text);
      }
    } catch (e) { /* fallback */ }
    return '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ==================== Dify API 调用 ====================

  /**
   * 步骤1: 上传文件到 Dify，获取 upload_file_id
   */
  async function uploadFileToDify(file) {
    var formData = new FormData();
    formData.append('file', file);
    formData.append('user', USER_ID);

    var response = await fetch(API_BASE + '/files/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + API_KEY },
      body: formData
    });

    if (!response.ok) {
      var errText = await response.text().catch(function () { return 'Unknown error'; });
      throw new Error('文件上传失败 (' + response.status + '): ' + errText);
    }

    var data = await response.json();
    return data.id; // upload_file_id
  }

  /**
   * 步骤2: 发送对话消息
   */
  async function sendChatMessage(query, fileIds) {
    var body = {
      inputs: {},
      query: query,
      user: USER_ID,
      response_mode: 'blocking'
    };

    if (conversationId) {
      body.conversation_id = conversationId;
    }

    if (fileIds && fileIds.length > 0) {
      body.files = fileIds.map(function (id) {
        return { type: 'document', transfer_method: 'local_file', upload_file_id: id };
      });
    }

    var response = await fetch(API_BASE + '/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      var errText = await response.text().catch(function () { return 'Unknown error'; });
      throw new Error('请求失败 (' + response.status + '): ' + errText);
    }

    return await response.json();
  }

  // ==================== 发送消息主流程 ====================
  async function handleSend() {
    var query = chatInput.value.trim();
    if (!query && pendingFiles.length === 0) return;
    if (isSending) return;

    // 如果没有文本但有文件，补充默认提示
    if (!query) {
      query = '请基于上传的文件内容进行总结和分析';
    }

    isSending = true;
    sendBtn.disabled = true;
    chatInput.disabled = true;

    // 显示用户消息
    var displayQuery = query;
    if (pendingFiles.length > 0) {
      displayQuery = query + '\n\n📎 已附加 ' + pendingFiles.length + ' 个文件';
    }
    addMessage('user', displayQuery);

    // 显示加载状态
    addLoadingMessage();

    // 保存当前文件列表（上传完成后清空）
    var filesToUpload = pendingFiles.slice();
    pendingFiles = [];
    renderFileTags();
    chatInput.value = '';

    try {
      // 步骤1: 上传所有文件
      var fileIds = [];
      for (var i = 0; i < filesToUpload.length; i++) {
        var fid = await uploadFileToDify(filesToUpload[i].file);
        fileIds.push(fid);
      }

      // 步骤2: 发送对话
      var result = await sendChatMessage(query, fileIds);

      removeLoadingMessage();

      // 保存 conversation_id 用于多轮对话
      if (result.conversation_id) {
        conversationId = result.conversation_id;
      }

      // 显示 AI 回复
      var answer = result.answer || '（未获取到回复内容）';
      addMessage('assistant', answer, false);

    } catch (error) {
      removeLoadingMessage();
      console.error('API Error:', error);
      addMessage('assistant', '服务暂时不可用，请稍后重试', true);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  // ==================== 事件绑定 ====================
  sendBtn.addEventListener('click', handleSend);

  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // ==================== 初始键盘快捷键 ====================
  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + K 快速打开/关闭面板
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (isPanelOpen) {
        closePanel();
      } else {
        openPanel();
      }
    }
  });

})();
