import { useState, useEffect, useRef, type FC } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { K2V_API_KEY, fetchK2VVideoBlobUrl } from '../../../api/k2v';

export const NodeK2VBlock: FC<{ knowledgePoint: string }> = ({ knowledgePoint }) => {
  const [status, setStatus] = useState<'running' | 'finished' | 'failed'>('running');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loadingText, setLoadingText] = useState<string>('正在从高维空间降维视频流...');
  const userProfile = useUserStore((state) => state.userProfile);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentBlobUrlRef = useRef<string>('');

  useEffect(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('running');
    setVideoUrl('');
    setLoadingText('正在初始化 K2V 降维引擎...');

    const parseDuration = (raw: unknown): number => {
      const parsed = Number.parseInt(String(raw ?? '5'), 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
    };

    const startIgnition = async (): Promise<void> => {
      try {
        const payload = {
          knowledge_point: knowledgePoint,
          difficulty: 'medium',
          age: Math.max(0, Number(userProfile.age) || 18),
          gender: String((userProfile as unknown as { gender?: string } | undefined)?.gender ?? ''),
          language: String(userProfile.language || 'Python'),
          duration: parseDuration(userProfile.duration),
          extra_info: String(userProfile.profile_summary || ''),
        };

        const response = await fetch('/api/k2v/api/v1/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'X-API-Key': K2V_API_KEY,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(
            `K2V 请求失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`,
          );
        }

        if (!response.body) {
          throw new Error('K2V 响应体为空，无法解析 SSE 流');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let currentEvent = '';
        let currentDataLines: string[] = [];
        let hasResult = false;

        const flushEvent = async (): Promise<void> => {
          if (!currentEvent && currentDataLines.length === 0) return;
          if (controller.signal.aborted) return;

          const rawData = currentDataLines.join('\n').trim();
          let parsed: Record<string, unknown> = {};
          if (rawData) {
            try {
              parsed = JSON.parse(rawData) as Record<string, unknown>;
            } catch {
              parsed = { message: rawData };
            }
          }

          const eventType = currentEvent || String(parsed.type ?? '').trim();
          const data = (parsed.data ?? {}) as Record<string, unknown>;
          const message = String(
            data.message ??
              parsed.message ??
              parsed.error ??
              (eventType === 'running' ? 'AI 正在生成视频...' : ''),
          );

          switch (eventType) {
            case 'running':
              setLoadingText(message || 'AI 正在生成视频...');
              break;
            case 'finished':
              if (!hasResult) {
                setLoadingText(message || '视频生成完成，等待视频资源...');
              }
              break;
            case 'failed':
              setStatus('failed');
              setLoadingText(message || '视频生成失败');
              break;
            case 'error':
              throw new Error(message || '视频生成异常');
            case 'result': {
              const videoFile = String(data.video_file ?? '');
              if (!videoFile) {
                throw new Error('后端未返回 video_file');
              }
              const blobUrl = await fetchK2VVideoBlobUrl(videoFile);
              if (controller.signal.aborted) {
                URL.revokeObjectURL(blobUrl);
                return;
              }
              hasResult = true;
              setVideoUrl((prev) => {
                if (prev.startsWith('blob:')) {
                  URL.revokeObjectURL(prev);
                }
                return blobUrl;
              });
              currentBlobUrlRef.current = blobUrl;
              setLoadingText(message || '渲染完成！');
              setStatus('finished');
              break;
            }
            default:
              break;
          }

          currentEvent = '';
          currentDataLines = [];
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await flushEvent();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line.trim()) {
              await flushEvent();
              continue;
            }
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              currentDataLines.push(line.slice(5).trim());
            }
          }
        }

        if (!controller.signal.aborted && !hasResult) {
          setStatus('failed');
          setLoadingText('未收到可播放的视频结果');
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('K2V Engine Failed:', error);
        setStatus('failed');
        setLoadingText(error instanceof Error ? error.message : 'K2V 引擎调用失败');
      }
    };

    void startIgnition();

    return () => {
      controller.abort();
      if (currentBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = '';
      }
    };
  }, [knowledgePoint, userProfile]);

  if (status === 'running') {
    return (
      <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid rgba(228, 200, 166, 0.3)', borderTopColor: 'var(--color-highlight-bg)', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>{loadingText}</span>
      </article>
    );
  }

  if (status === 'failed') {
    return (
      <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>K2V 引擎降维失败：{loadingText}</span>
      </article>
    );
  }

  return (
    <article style={{ borderRadius: '24px', backgroundColor: 'var(--bg-canvas)', boxShadow: 'var(--shadow-soft)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🎬</span> 沉浸视界 (K2V)
      </h3>
      {/* 浅色拟态播放器占位 - 强对比度重塑 */}
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', backgroundColor: 'var(--code-bg)', border: '2px solid rgba(228, 200, 166, 0.3)', boxShadow: 'inset 0 4px 20px rgba(228, 200, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }}
          />
        ) : (
          // 视觉焦点的深色播放按钮（后备）
          <div
            style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--text-heading)', boxShadow: '0 8px 24px rgba(44, 22, 8, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(44, 22, 8, 0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(44, 22, 8, 0.25)'; }}
          >
            {/* 镂空的浅色播放三角 */}
            <div style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '24px solid var(--bg-canvas)', marginLeft: '8px' }} />
          </div>
        )}
      </div>
    </article>
  );
};
