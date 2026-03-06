import { useEffect, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchC2VVideoBlobUrl, generateC2VVideo } from '../../../api/c2v';

const C2V: FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<'simple' | 'medium' | 'hard'>('medium');
  const [problemText, setProblemText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<{ url: string; problem: string; code: string }[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const isFormValid = problemText.trim() !== '' && codeText.trim() !== '';

  const replaceVideoUrl = (nextUrl: string | null): void => {
    setVideoUrl(nextUrl);
  };

  const trackBlobUrl = (url: string): void => {
    if (!url.startsWith('blob:')) return;
    if (!blobUrlsRef.current.includes(url)) {
      blobUrlsRef.current.push(url);
    }
  };

  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      blobUrlsRef.current = [];
    };
  }, []);

  const handleReset = (): void => {
    setProblemText('');
    setCodeText('');
    setProgressMsg('');
    setIsGenerating(false);
    replaceVideoUrl(null);
  };

  // 发起 C2V 生成请求并消费 SSE 流
  const handleGenerate = async (): Promise<void> => {
    if (!isFormValid || isGenerating) return;

    const currentProblem = problemText;
    const currentCode = codeText;

    setIsGenerating(true);
    replaceVideoUrl(null);
    setProgressMsg('正在唤醒算力...');

    try {
      await generateC2VVideo(
        {
          problem_description: currentProblem,
          solution_code: currentCode,
          difficulty,
          duration: 5,
        },
        {
          onRunning: (message) => {
            setProgressMsg(message || '正在生成视频...');
          },
          onResult: async (videoFile, message) => {
            if (message) {
              setProgressMsg(message);
            }
            if (videoFile) {
              const blobUrl = await fetchC2VVideoBlobUrl(videoFile);
              trackBlobUrl(blobUrl);
              replaceVideoUrl(blobUrl);
              setHistoryList((prev) => [
                { url: blobUrl, problem: currentProblem, code: currentCode },
                ...prev,
              ]);
            }
          },
          onFinished: (message) => {
            setProgressMsg(message || '视频生成完成');
          },
          onFailed: (message) => {
            setProgressMsg(`[警告] ${message || '视频生成受阻，正在重试...'}`);
          },
          onError: (message) => {
            setProgressMsg(`[警告] ${message || '视频生成异常，正在重试...'}`);
          },
        },
      );
    } catch (_error: unknown) {
      setProgressMsg('网络连接已断开');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '48px 24px 128px 24px',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          alignSelf: 'flex-start',
          marginBottom: 32,
          color: 'var(--text-primary)',
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ← 返回主页面
      </button>

      <section
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-heading, #BE8944)',
          }}
        >
          Code 2 Video
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          你的专属算法题解视听库
        </p>
      </section>

      <section
        style={{
          width: '100%',
          marginTop: 48,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            height: 56,
            alignSelf: 'center',
            backgroundColor: 'var(--bg-canvas, #FFFDF4)',
            borderRadius: 9999,
            boxShadow: 'var(--shadow-inner)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
          }}
        >
          <input
            type="text"
            placeholder="搜索已生成的题目视频..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 16,
            }}
          />
        </div>

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            boxSizing: 'border-box',
          }}
        >
          {[
            { title: '合并区间 (Merge Intervals)', url: '/mock_media/合并区间.mp4' },
            { title: '最长回文子串 - DP解法', url: '/mock_media/最长回文子串-DP解法.mp4' },
            { title: '正则表达式匹配', url: '/mock_media/正则表达式匹配.mp4' },
          ].map((item) => (
            <article
              key={item.title}
              style={{
                borderRadius: 24,
                backgroundColor: 'var(--bg-canvas, #FFFDF4)',
                boxShadow: 'var(--shadow-soft)',
                padding: 16,
                boxSizing: 'border-box',
              }}
            >
              <video
                src={item.url}
                muted
                controls
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: 16,
                  objectFit: 'cover',
                  backgroundColor: '#000000',
                  display: 'block',
                }}
              />
              <p
                style={{
                  margin: '16px 0 0 0',
                  fontSize: 16,
                  lineHeight: 1.6,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {item.title}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          backgroundColor: '#FFFFFF',
          padding: 32,
          borderRadius: 24,
          boxShadow: 'var(--shadow-soft)',
          marginTop: 48,
          marginBottom: 64,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label
            htmlFor="c2v-problem-input"
            style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}
          >
            输入题目描述
          </label>
          <textarea
            id="c2v-problem-input"
            placeholder="请粘贴题目背景、输入输出与约束条件..."
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            style={{
              width: '100%',
              minHeight: 192,
              padding: 16,
              borderRadius: 16,
              border: 'none',
              boxShadow: 'var(--shadow-inner)',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              fontSize: 16,
              lineHeight: '24px',
              fontFamily: "system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif",
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label
            htmlFor="c2v-code-input"
            style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}
          >
            输入答案 / 核心代码
          </label>
          <textarea
            id="c2v-code-input"
            placeholder="请粘贴可运行的核心代码..."
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            style={{
              width: '100%',
              height: 240,
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--code-border, #e4c8a6)',
              backgroundColor: 'var(--code-bg)',
              color: 'var(--text-primary)',
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              fontSize: 16,
              lineHeight: '24px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            marginTop: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
            {[
              { label: '简单', value: 'simple' as const },
              { label: '中等', value: 'medium' as const },
              { label: '困难', value: 'hard' as const },
            ].map((item) => {
              const isActive = difficulty === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDifficulty(item.value)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 9999,
                    fontSize: 14,
                    fontWeight: 700,
                    border: isActive ? 'none' : '1px solid var(--code-border, #e4c8a6)',
                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                    backgroundColor: isActive ? 'var(--text-heading, #BE8944)' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-hover)' : 'var(--shadow-soft)',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              onClick={handleGenerate}
              disabled={!isFormValid || isGenerating}
              style={{
                padding: '14px 32px',
                borderRadius: 14,
                fontSize: 20,
                fontWeight: 800,
                color: '#FFFFFF',
                backgroundColor: 'var(--text-heading, #BE8944)',
                boxShadow: isFormValid ? 'var(--shadow-soft)' : 'none',
                border: 'none',
                opacity: isGenerating ? 0.7 : isFormValid ? 1 : 0.5,
                cursor: !isFormValid || isGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {isGenerating ? progressMsg || '生成中...' : '✨ 生成代码解析视频'}
            </button>
          </div>
        </div>
      </section>

      {videoUrl && (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            backgroundColor: '#000000',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-soft)',
            marginTop: '40px',
            boxSizing: 'border-box',
          }}
        >
          <video
            controls
            autoPlay
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

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
                  replaceVideoUrl(item.url);
                  setProblemText(item.problem);
                  setCodeText(item.code);
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {item.problem}
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

export default C2V;
