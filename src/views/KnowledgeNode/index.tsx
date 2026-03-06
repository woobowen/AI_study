import { isValidElement, useEffect, useMemo, useRef, useState, type CSSProperties, type FC, type ReactElement, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import ReactMarkdown from 'react-markdown';
import { generateKnowledgeExplanation } from '../../api/goagents/knowledge';
import { useUserStore } from '../../store/useUserStore';
import type { KnowledgeExplanationResult, MindMap } from '../../api/goagents/types';

const cardBaseStyle: CSSProperties = {
  borderRadius: '24px',
  padding: '40px',
  boxShadow: 'var(--shadow-soft)',
  backgroundColor: 'var(--bg-canvas)',
  boxSizing: 'border-box',
};

const KnowledgeNode: FC = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const userProfile = useUserStore((s) => s.userProfile);
  const mastered_knowledge = useUserStore((s) => s.mastered_knowledge);

  const decodedNodeId = useMemo(() => {
    if (!nodeId) {
      return '';
    }
    try {
      return decodeURIComponent(nodeId);
    } catch {
      return nodeId;
    }
  }, [nodeId]);

  const [status, setStatus] = useState<'idle' | 'running' | 'finished' | 'failed'>('idle');
  const [markdown, setMarkdown] = useState<string>('');
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNodeData = () => {
    if (!decodedNodeId) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStatus('running');
    setMarkdown('');
    setMindMap(null);
    const payload = {
      knowledge_point: decodedNodeId,
      age: userProfile.age,
      gender: '',
      language: userProfile.language,
      duration: userProfile.duration,
      profile_text: userProfile.profile_summary || userProfile.supplements || '',
    };
    const masteredText = mastered_knowledge.length > 0
      ? `\n特别注意：该用户已完全掌握以下知识点：${mastered_knowledge.join(', ')}。请在生成计划和考题时，绝对不要再包含或考核这些已掌握的内容！`
      : '';
    const finalPayload = {
      ...payload,
      profile_text: (payload.profile_text || '') + masteredText,
    };
    console.log(
      '🚀【API 冲锋发起】发往 GoAgents 的原始负载 (Payload):',
      JSON.parse(JSON.stringify(finalPayload)),
    );

    void generateKnowledgeExplanation(
      finalPayload,
      {
        onStatus: (nextStatus) => {
          if (nextStatus === 'running' || nextStatus === 'finished' || nextStatus === 'failed') {
            setStatus(nextStatus);
            return;
          }
          setStatus('failed');
        },
        onData: (data: KnowledgeExplanationResult) => {
          console.log('【SSE 真实数据拦截】 Markdown:', data.markdown);
          console.log('【SSE 真实数据拦截】 MindMap:', JSON.stringify(data.mind_map, null, 2));
          setMarkdown(data.markdown || '');
          setMindMap(data.mind_map || null);
        },
        onError: () => {
          setStatus('failed');
        },
      },
      controller.signal,
    ).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setStatus('failed');
    });
  };

  useEffect(() => {
    if (!decodedNodeId) {
      return;
    }
    fetchNodeData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [decodedNodeId]);

  const mapMindMapToEChartsData = (source: MindMap | null) => {
    if (!source) {
      return null;
    }
    return {
      name: source.root_topic || '知识节点',
      children: (source.main_branches || []).map((branch) => ({
        name: branch.title,
        children: (branch.sub_topics || []).map((subTopic: string) => ({ name: subTopic })),
      })),
    };
  };

  const getOption = (echartsData: { name: string; children: Array<{ name: string; children: Array<{ name: string }> }> }) => ({
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [
      {
        type: 'tree',
        data: [echartsData],
        roam: true,
        orient: 'LR',
        initialTreeDepth: 1,
        top: '6%',
        left: '6%',
        bottom: '6%',
        right: '24%',
        symbol: 'emptyCircle',
        symbolSize: 10,
        lineStyle: {
          color: 'rgba(190, 137, 68, 0.4)',
          curveness: 0.5,
          width: 2,
        },
        label: {
          color: 'var(--text-primary)',
          fontSize: 14,
          backgroundColor: 'var(--bg-canvas)',
          padding: [6, 12],
          borderRadius: 8,
          borderColor: 'var(--code-border)',
          borderWidth: 1,
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left',
          },
        },
        expandAndCollapse: true,
        animationDuration: 550,
        animationDurationUpdate: 750,
      },
    ],
  });

  const echartsData = useMemo(() => mapMindMapToEChartsData(mindMap), [mindMap]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <section
        style={{
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
          padding: '64px 80px',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '56px',
            fontWeight: 800,
            color: 'var(--text-heading)',
            textShadow: '2px 2px 4px rgba(228, 200, 166, 0.2)',
            lineHeight: 1.1,
          }}
        >
          {decodedNodeId || '知识节点'}
        </h1>

        <article
          style={{
            ...cardBaseStyle,
            height: 'auto',
            minHeight: 'fit-content',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            border: '1px dashed var(--code-border)',
            backgroundImage:
              'linear-gradient(to right, rgba(228, 200, 166, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(228, 200, 166, 0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {status === 'running' && !mindMap && (
            <p
              style={{
                margin: 0,
                color: 'var(--color-info-text, var(--text-primary))',
                fontWeight: 700,
              }}
            >
              [🧠 AI 正在为您构建思维导图...]
            </p>
          )}
          {status !== 'failed' && echartsData && (
            <div style={{ width: '100%', height: '600px' }}>
              <ReactECharts option={getOption(echartsData)} style={{ height: '600px', width: '100%' }} />
            </div>
          )}
          {status === 'failed' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                gap: '16px',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--color-warn-text)' }}>[ ⚠️ 后端推流意外中断，可能是大模型产生了结构性幻觉 ]</span>
              <button
                onClick={fetchNodeData}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-warn-bg)',
                  color: 'var(--color-warn-text)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                重新生成 (Retry)
              </button>
            </div>
          )}
          {status === 'finished' && !mindMap && (
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>[思维导图暂无数据]</p>
          )}
        </article>
        <article
          style={{
            ...cardBaseStyle,
            height: 'auto',
            minHeight: 'fit-content',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {status === 'running' && !markdown && (
            <p
              style={{
                margin: 0,
                color: 'var(--color-info-text, var(--text-primary))',
                fontWeight: 700,
              }}
            >
              [✍️ AI 正在编撰深度解析...]
            </p>
          )}
          {status === 'failed' ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                gap: '16px',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--color-warn-text)' }}>[ ⚠️ 后端推流意外中断，可能是大模型产生了结构性幻觉 ]</span>
              <button
                onClick={fetchNodeData}
                style={{
                  padding: '8px 24px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-warn-bg)',
                  color: 'var(--color-warn-text)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                重新生成 (Retry)
              </button>
            </div>
          ) : status !== 'running' || markdown ? (
            <div
              style={{
                wordBreak: 'break-word',
              }}
            >
              {markdown ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 style={{ color: 'var(--text-heading)', margin: '20px 0 12px' }}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{ color: 'var(--text-heading)', margin: '18px 0 10px' }}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ color: 'var(--text-heading)', margin: '16px 0 8px' }}>{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p style={{ margin: '10px 0', color: 'var(--text-primary)', lineHeight: 1.8 }}>{children}</p>
                    ),
                    li: ({ children }) => (
                      <li style={{ margin: '10px 0', color: 'var(--text-primary)', lineHeight: 1.8 }}>{children}</li>
                    ),
                    pre: ({ children }) => {
                      if (!isValidElement(children)) {
                        return <pre style={{ margin: '20px 0' }}>{children}</pre>;
                      }

                      const codeElement = children as ReactElement<{ className?: string; children?: ReactNode }>;
                      const className = typeof codeElement.props.className === 'string' ? codeElement.props.className : '';
                      const rawCode = codeElement.props.children;
                      const normalizedCode = Array.isArray(rawCode) ? rawCode.join('') : String(rawCode || '');
                      const language = (className.match(/language-(\w+)/)?.[1] || 'text')
                        .replace(/^[a-z]/, (letter: string) => letter.toUpperCase());
                      return (
                        <div
                          style={{
                            backgroundColor: 'var(--code-bg)',
                            border: '1px solid var(--code-border)',
                            borderRadius: '16px',
                            padding: '24px',
                            overflowX: 'auto',
                            margin: '20px 0',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '8px',
                              left: '12px',
                              color: 'var(--text-heading)',
                              opacity: 0.6,
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {language}
                          </span>
                          <pre style={{ margin: 0, paddingTop: '12px' }}>
                            <code
                              className={className}
                              style={{
                                color: '#2e3436',
                                fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                                fontSize: '15px',
                                lineHeight: 1.6,
                                whiteSpace: 'pre',
                              }}
                            >
                              {normalizedCode.replace(/\n$/, '')}
                            </code>
                          </pre>
                        </div>
                      );
                    },
                    code: ({ children, className }) => {
                      if (className) {
                        return <code className={className}>{children}</code>;
                      }
                      return (
                        <code
                          style={{
                            backgroundColor: 'rgba(228, 200, 166, 0.28)',
                            borderRadius: '8px',
                            padding: '2px 8px',
                            color: '#204a87',
                            fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
                            fontSize: '0.95em',
                          }}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-primary)' }}>[暂无解析内容]</p>
              )}
            </div>
          ) : null}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--code-bg)',
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              border: '1px solid var(--code-border)',
            }}
          >
            [代码占位区] function traverse(root) {'{'} ... {'}'}
          </div>
        </article>

        <article
          style={{
            ...cardBaseStyle,
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <h3 style={{ margin: 0 }}>视频降维</h3>
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '16px',
              border: '1px solid var(--code-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            [16:9 假播放器占位框]
          </div>
        </article>

        <article
          style={{
            ...cardBaseStyle,
            height: '500px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--code-border)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-highlight-bg)',
              color: 'var(--color-highlight-text, var(--text-primary))',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            [✨ 可交互]
          </span>
          <span>[3D WebGL 引擎占位区]</span>
        </article>
      </section>

      <aside
        style={{
          width: '20%',
          minWidth: '340px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '2px solid rgba(228, 200, 166, 0.15)',
          backgroundColor: 'var(--bg-canvas)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            height: '10%',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            [← 返回主页面]
          </button>
        </div>

        <div
          style={{
            height: '20%',
            padding: '24px',
            borderBottom: '1px solid rgba(228, 200, 166, 0.2)',
            boxSizing: 'border-box',
          }}
        >
          <h3 style={{ margin: 0, marginBottom: '16px' }}>今日学习计划</h3>
          <p
            style={{
              margin: 0,
              color: 'var(--color-success-text, var(--text-primary))',
              fontWeight: 700,
            }}
          >
            [进度占位：已完成 3/4]
          </p>
        </div>

        <div
          style={{
            flex: 1,
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <p style={{ margin: 0 }}>[AI Chat 伴学舱占位]</p>
        </div>
      </aside>
    </div>
  );
};

export default KnowledgeNode;
