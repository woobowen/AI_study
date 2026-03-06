import { useEffect, useRef, useState, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchK2VVideoBlobUrl, generateVideoSSE } from '../../../api/k2v';
import { useK2VStore } from '../../../store/useK2VStore';
import { useUserStore } from '../../../store/useUserStore';

/** 幽灵态返回按钮样式 */
const backButtonStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: 16,
  fontWeight: 600,
  padding: 8,
  borderRadius: 16,
  cursor: 'pointer',
  marginBottom: 24,
};

/** 纯白控制台卡片样式 */
const consoleCardStyle: CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  borderRadius: 24,
  boxShadow: 'var(--shadow-soft)',
  padding: 32,
  boxSizing: 'border-box',
};

/** K2V 主视图骨架 */
const K2V: FC = () => {
  const navigate = useNavigate();
  const userProfile = useUserStore((s) => s.userProfile);
  const difficulty = useK2VStore((s) => s.difficulty);
  const isGenerating = useK2VStore((s) => s.isGenerating);
  const progress = useK2VStore((s) => s.progress);
  const loadingText = useK2VStore((s) => s.loadingText);
  const videoUrl = useK2VStore((s) => s.videoUrl);
  const inputText = useK2VStore((s) => s.inputText);
  const setInputText = useK2VStore((s) => s.setInputText);
  const setDifficulty = useK2VStore((s) => s.setDifficulty);
  const reset = useK2VStore((s) => s.reset);
  const [historyList, setHistoryList] = useState<{ url: string; title: string }[]>([]);
  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current = [];
    };
  }, []);

  const trackBlobUrl = (url: string): void => {
    if (!url.startsWith('blob:')) return;
    if (!blobUrlsRef.current.includes(url)) {
      blobUrlsRef.current.push(url);
    }
  };

  /** 触发视频生成：串联输入校验、SSE 状态映射与结果落盘 */
  const handleGenerate = async (): Promise<void> => {
    const knowledgePoint = inputText.trim();
    if (!knowledgePoint) {
      alert('请输入要生成视频的知识点');
      return;
    }

    // 从全局画像安全提取字段；缺失时提供降级默认值，避免 undefined 触发运行时异常
    const age = Number.isFinite(userProfile?.age) ? Math.max(0, userProfile.age) : 14;
    const gender = String(
      (userProfile as unknown as { gender?: string } | undefined)?.gender ?? '',
    );
    const language = String(userProfile?.language ?? 'Python').trim() || 'Python';
    const profileSummary = String(userProfile?.profile_summary ?? '').trim();

    // 🚨 语义隔离红线：K2V 的 duration 是“视频分钟数”，严禁传入画像中的“学习周期天数”
    const payload = {
      knowledge_point: knowledgePoint,
      difficulty,
      age,
      gender,
      language,
      duration: 5,
      extra_info: profileSummary || undefined,
    };

    try {
      // 发起真实请求前，先设置初始生成态
      useK2VStore.getState().setVideoUrl('');
      useK2VStore.getState().setGenerating(true);
      useK2VStore.getState().setProgress(1);
      useK2VStore.getState().setLoadingText('正在唤醒后端算力引擎...');

      // 智能虚拟进度引擎：每 3 秒随机推进 1~3%，并强制封顶 95%
      const progressTimer: ReturnType<typeof setInterval> = setInterval(() => {
        const current = useK2VStore.getState().progress;
        if (current >= 95) return;
        const delta = Math.floor(Math.random() * 3) + 1;
        useK2VStore.getState().setProgress(Math.min(95, current + delta));
      }, 3000);

      await generateVideoSSE(payload, {
        onRunning: (message) => {
          useK2VStore.getState().setLoadingText(message || 'AI 正在生成视频...');
        },
        onResult: async (videoFile) => {
          clearInterval(progressTimer);
          useK2VStore.getState().setProgress(100);
          useK2VStore.getState().setLoadingText('渲染完成！');
          if (videoFile) {
            const blobUrl = await fetchK2VVideoBlobUrl(videoFile);
            trackBlobUrl(blobUrl);
            useK2VStore.getState().setVideoUrl(blobUrl);
            setHistoryList((prev) => [{ url: blobUrl, title: knowledgePoint }, ...prev]);
          } else {
            useK2VStore.getState().setVideoUrl('');
          }
          useK2VStore.getState().setGenerating(false);
        },
        onFinished: () => {
          // finished 事件只做文案同步，最终完成态以 result 为准
          useK2VStore.getState().setLoadingText('正在回传视频资源...');
        },
        onFailed: (message) => {
          clearInterval(progressTimer);
          useK2VStore.getState().setLoadingText(message || '视频生成失败');
          useK2VStore.getState().setGenerating(false);
        },
        onError: (message) => {
          clearInterval(progressTimer);
          useK2VStore.getState().setLoadingText(message || '生成过程出现异常');
          useK2VStore.getState().setGenerating(false);
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '生成过程出现异常';
      useK2VStore.getState().setGenerating(false);
      alert(message);
    }
  };

  /** 清空结果并回到输入态，便于重新发起生成 */
  const handleReset = (): void => {
    reset();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        width: '100%',
      }}
    >
      <button type="button" style={backButtonStyle} onClick={() => navigate('/')}>
        ← 返回主页面
      </button>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 64,
            lineHeight: '72px',
            color: 'var(--text-heading, #BE8944)',
            fontWeight: 800,
          }}
        >
          Knowledge 2 Video
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: '32px',
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}
        >
          你的专属 AIGC 视频知识库
        </p>
      </section>

      {/* 存量视频矩阵：搜索栏 + 响应式视频卡片网格（开发期 MOCK 占位） */}
      <div
        style={{
          marginTop: 48,
          width: '100%',
        }}
      >
        {/* 搜索栏：56px 高度，全圆角，内凹阴影 */}
        <div
          style={{
            width: '100%',
            maxWidth: 600,
            margin: '0 auto',
            height: 56,
            borderRadius: 9999,
            background: 'var(--bg-canvas)',
            boxShadow: 'var(--shadow-inner)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
          }}
        >
          <input
            type="text"
            placeholder="搜索已生成的知识点视频..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 16,
              lineHeight: '24px',
            }}
          />
        </div>

        {/* 视频矩阵：响应式 auto-fill 卡片布局，间距严格 32px */}
        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 32,
          }}
        >
          <div
            style={{
              borderRadius: 20,
              background: 'var(--bg-canvas)',
              boxShadow: 'var(--shadow-soft)',
              padding: 16,
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 16,
                background: '#f6ebd7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(190, 137, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: '16px solid var(--text-heading)',
                    marginLeft: 4,
                  }}
                />
              </div>
            </div>

            <p
              style={{
                margin: '16px 0 0 0',
                color: 'var(--text-primary)',
                fontSize: 16,
                lineHeight: '24px',
                fontWeight: 500,
              }}
            >
              二叉树数据结构基础讲解 (MOCK 推荐占位)
            </p>
          </div>
        </div>
      </div>

      <section
        style={{
          ...consoleCardStyle,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>
          {`@keyframes k2v-console-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`}
        </style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入你想生成视频的知识点..."
            style={{
              width: '100%',
              minHeight: 192,
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              padding: 16,
              borderRadius: 16,
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-inner)',
              boxSizing: 'border-box',
              fontSize: 16,
              lineHeight: '24px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {[
              { label: '入门', value: 'simple' as const },
              { label: '中等', value: 'medium' as const },
              { label: '专家', value: 'hard' as const },
            ].map((item) => {
              // 使用显式选中态分支，避免白底白字与边框冲突
              const isActive = difficulty === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDifficulty(item.value)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: '24px',
                    fontWeight: 600,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    // 选中态强制暖金底 + 白字；未选中态保持透明底 + 轻量边框
                    background: isActive ? 'var(--text-heading, #BE8944)' : 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary, #2C1608)',
                    borderColor: isActive ? 'transparent' : 'var(--code-border, #e4c8a6)',
                    boxShadow: isActive ? 'var(--shadow-hover)' : 'var(--shadow-soft)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                border: 'none',
                borderRadius: 16,
                padding: '8px 24px',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-heading, #BE8944)',
                fontSize: 16,
                lineHeight: '24px',
                fontWeight: 600,
              }}
            >
              ✨ 再次生成新视频
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              style={{
                border: 'none',
                borderRadius: 24,
                padding: '16px 32px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.75 : 1,
                background: 'var(--text-heading, #BE8944)',
                color: '#FFFFFF',
                fontSize: 20,
                lineHeight: '32px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-hover)',
              }}
            >
              <span>{isGenerating ? '生成中...' : '✨ 在线生成'}</span>
            </button>
          </div>

          {videoUrl && (
            <div
              style={{
                marginTop: '40px',
                aspectRatio: '16/9',
                width: '100%',
                backgroundColor: '#000000',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          )}

        </div>

        {/* 生成态微光遮罩：固定挂载在控制台内部，不影响页面其他区域 */}
        {isGenerating && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 253, 244, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: '4px solid rgba(190, 137, 68, 0.24)',
                  borderTopColor: 'var(--text-heading, #BE8944)',
                  animation: 'k2v-console-spin 1s linear infinite',
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: '24px',
                  color: 'var(--text-heading, #BE8944)',
                  fontWeight: 500,
                }}
              >
                {loadingText}
              </p>
              <div
                style={{
                  width: 256,
                  height: 8,
                  background: '#e5e7eb',
                  borderRadius: 9999,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: '#3b82f6',
                    borderRadius: 9999,
                    width: `${progress}%`,
                    transition: 'width 0.5s',
                  }}
                />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: '20px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                {progress}%
              </p>
            </div>
          </div>
        )}
      </section>

      {historyList.length > 0 && (
        <section
          style={{
            marginTop: '64px',
            width: '100%',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              color: 'var(--text-heading)',
              marginBottom: '24px',
            }}
          >
            本次生成历史
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
            }}
          >
            {historyList.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  useK2VStore.getState().setVideoUrl(item.url);
                  setInputText(item.title);
                }}
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-soft)',
                  cursor: 'pointer',
                }}
              >
                <video
                  src={item.url}
                  muted
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ padding: '16px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: '20px',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default K2V;
