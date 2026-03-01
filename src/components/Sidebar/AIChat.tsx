import React, { useState } from 'react';

/** 单条消息数据结构 */
interface ChatMessage {
  /** 消息唯一标识 */
  id: string;
  /** 发送角色：assistant = AI，user = 用户 */
  role: 'assistant' | 'user';
  /** 消息文本内容 */
  content: string;
}

/** 预置的 Mock 欢迎消息 */
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-001',
  role: 'assistant',
  content: '🐱 喵~ 你好呀！我是你的 AI 学习伙伴，有什么想聊的尽管问我吧！',
};

/**
 * 侧边栏底部 —— AI 对话区
 * 占据右侧栏剩余空间（flex: 1），内部分为消息流 + 底部毛玻璃输入框
 */
const AIChat: React.FC = () => {
  /* 消息列表状态 */
  const [messages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  /* 输入框受控值 */
  const [inputValue, setInputValue] = useState('');

  /** 处理发送（当前仅占位，后续接入 SSE） */
  const handleSend = () => {
    if (!inputValue.trim()) return;
    // TODO: 接入 fetchSSE 实现真实对话
    setInputValue('');
  };

  /** 回车发送 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section
      className="ai-chat"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* ====== 消息流区域（可滚动） ====== */}
      <div
        className="ai-chat__messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          paddingBottom: 96, /* 为底部输入框留出空间 */
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: 16,
              borderRadius: 16,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text-primary, #374151)',
              background:
                msg.role === 'user'
                  ? 'var(--color-primary-bg, #dbeafe)'
                  : 'var(--color-info-bg, #e0e5ec)',
              boxShadow:
                'var(--shadow-soft, 3px 3px 6px #c8ccd0, -3px -3px 6px #ffffff)',
            }}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* ====== 底部毛玻璃输入区（绝对定位固定在底部） ====== */}
      <div
        className="ai-chat__input-bar"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          /* 毛玻璃效果 */
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.45)',
          borderTop: '1px solid var(--border-default, rgba(200,200,210,0.25))',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 16,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: 'var(--text-primary, #374151)',
              background: 'var(--color-info-bg, #e0e5ec)',
              /* 内凹阴影 */
              boxShadow:
                'var(--shadow-inner, inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff)',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-info-bg, #e0e5ec)',
              boxShadow:
                'var(--shadow-soft, 3px 3px 6px #c8ccd0, -3px -3px 6px #ffffff)',
              color: 'var(--text-primary, #374151)',
            }}
            aria-label="发送消息"
          >
            ➤
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIChat;
