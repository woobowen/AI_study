import { useEffect, useState, type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { generate3DModelStream } from '../../../api/sandbox3d/generate'
import ImmersiveLayout from '../../../layouts/ImmersiveLayout'
import { getUserProfilePayload, useUserStore } from '../../../store/useUserStore'
import './index.css'

interface ModelRecord {
  hash: string
  concept: string
  timestamp: number
}

const RECOMMENDED_MODELS: ModelRecord[] = [
  {
    hash: 'bc7ab7937848dfe42b9351ea13fbd3f2dc124f6effd6d0c6e89df037ef6d8907',
    concept: '遍历二叉树',
    timestamp: Date.now(),
  },
  {
    hash: 'c41e09197755563df5263fea29f27ea3a5f1884f03b985a55106d87bce3ce09e',
    concept: '冒泡排序',
    timestamp: Date.now(),
  },
  {
    hash: 'e8ecbfca6d66dc917dbb7308648fc9943a5681e528bcad861ff4aaa391fa7f0a',
    concept: '图搜索',
    timestamp: Date.now(),
  },
]

// 语义化封面引擎：根据知识点和 Hash 匹配配色与拓扑图标
const getSemanticCover = (concept: string, hash: string) => {
  const isSort = concept.includes('排序')
  const isTree = concept.includes('树')
  const isGraph = concept.includes('图') || concept.includes('路径') || concept.includes('搜索')

  void hash

  // 严格遵守配色表规范
  let bgGradient = ''
  let iconColor = ''
  let svgPath = ''

  if (isSort) {
    // 强调/高亮色
    bgGradient = 'linear-gradient(135deg, #FDDFCA 0%, #f7bc93 100%)'
    iconColor = '#C35101'
    svgPath =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 20V10M12 20V4M6 20v-6" />'
  } else if (isTree) {
    // 成功/正确色
    bgGradient = 'linear-gradient(135deg, #effce3 0%, #c7e7aa 100%)'
    iconColor = '#478211'
    svgPath =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6a2 2 0 00-2 2v2m16-4a2 2 0 00-2-2h-2m-8 2a2 2 0 00-2-2H4" />'
  } else if (isGraph) {
    // 提示/信息色
    bgGradient = 'linear-gradient(135deg, #ecf6fa 0%, #bde0ee 100%)'
    iconColor = '#1A7F99'
    svgPath =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v8l9-11h-7z" />'
  } else {
    // 重要概念色 (默认/汉诺塔等)
    bgGradient = 'linear-gradient(135deg, #FAECD2 0%, #f2cf7f 100%)'
    iconColor = '#9B6D0B'
    svgPath =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />'
  }

  return (
    <div
      style={{
        background: bgGradient,
        width: '100%',
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        dangerouslySetInnerHTML={{ __html: svgPath }}
      />
    </div>
  )
}

const Sandbox3D: FC = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [modelHash, setModelHash] = useState('')
  const [iframeHtml, setIframeHtml] = useState<string>('')
  const [concept, setConcept] = useState('')
  const [difficulty, setDifficulty] = useState('simple')
  const masteredKnowledge = useUserStore((s) => s.mastered_knowledge)
  const [historyModels, setHistoryModels] = useState<ModelRecord[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const saved = localStorage.getItem('sandbox3d_history')
      return saved ? (JSON.parse(saved) as ModelRecord[]) : []
    } catch {
      return []
    }
  })

  const handleRecallModel = (hash: string, conceptName: string): void => {
    setConcept(conceptName)
    setModelHash(hash)
  }

  useEffect(() => {
    if (modelHash) {
      fetch(`/api/3d-sandbox/viewer/${modelHash}`)
        .then((res) => res.text())
        .then((html) => {
          let fixedHtml = html
            .replace(/\/outputs\//g, '/api/3d-sandbox/outputs/')
            .replace(/\/api\/chat/g, '/api/3d-sandbox/api/chat')
            .replace(/\/api\/data\//g, '/api/3d-sandbox/api/data/')
          setIframeHtml(fixedHtml)
        })
        .catch((err) => console.error('Viewer HTML 拉取失败:', err))
    }
  }, [modelHash])

  const handleProbeGenerate = async (): Promise<void> => {
    if (isGenerating) return

    const knowledgePoint = concept.trim()
    if (!knowledgePoint) {
      alert('请输入知识点描述')
      return
    }

    setIsGenerating(true)
    setLogs([])
    setModelHash('')
    setIframeHtml('')

    const currentProfile = getUserProfilePayload()

    try {
      await generate3DModelStream(knowledgePoint, difficulty, currentProfile, masteredKnowledge, {
        onProgress: (msg: string) => {
          setLogs((prev) => [...prev, msg])
        },
        onError: (err: string) => {
          setLogs((prev) => [...prev, `[ERROR] ${err}`])
          setIsGenerating(false)
        },
        onComplete: (hash: string) => {
          setModelHash(hash)
          setLogs((prev) => [...prev, `[COMPLETE] ${hash}`])
          setIsGenerating(false)
          const newRecord: ModelRecord = { hash, concept: knowledgePoint, timestamp: Date.now() }
          setHistoryModels((prev) => {
            const updated = [newRecord, ...prev.filter((item) => item.hash !== hash)].slice(0, 10)
            if (typeof window !== 'undefined') {
              localStorage.setItem('sandbox3d_history', JSON.stringify(updated))
            }
            return updated
          })
        },
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '生成链路异常'
      setLogs((prev) => [...prev, `[ERROR] ${message}`])
      setIsGenerating(false)
    }
  }

  return (
    <ImmersiveLayout>
      <div className="k2v-mirror-root">
        <header className="k2v-mirror-header">
          <button type="button" className="k2v-mirror-back" onClick={() => navigate('/')}>
            ← 返回主页面
          </button>
          <h1 className="k2v-mirror-title">3D 模型沙盒</h1>
          <p className="k2v-mirror-subtitle">你的专属 AIGC 3D 认知资产库</p>
        </header>

        <section className="k2v-mirror-assets">
          <h3 className="k2v-mirror-assets-title">推荐模型</h3>
          <div className="k2v-mirror-grid">
            {RECOMMENDED_MODELS.map((item) => (
              <article
                key={item.hash}
                className="k2v-mirror-card k2v-mirror-card-clickable"
                onClick={() => handleRecallModel(item.hash, item.concept)}
              >
                {getSemanticCover(item.concept, item.hash)}
                <p className="k2v-mirror-card-title">{item.concept}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="k2v-mirror-console">
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="请输入你想生成3D模型的知识点..."
            className="k2v-mirror-textarea"
            disabled={isGenerating}
          />

          <div className="k2v-mirror-pills">
            {['simple', 'medium', 'hard'].map((lvl, i) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                className={`k2v-mirror-pill ${difficulty === lvl ? 'active' : ''}`}
              >
                {['入门', '中等', '专精'][i]}
              </button>
            ))}
          </div>

          <div className="k2v-mirror-console-actions">
            <button
              type="button"
              onClick={() => {
                setConcept('')
                setLogs([])
                setIsGenerating(false)
                setModelHash('')
                setIframeHtml('')
              }}
              className="k2v-mirror-reset"
            >
              ✨ 再次生成新模型
            </button>
            <button
              type="button"
              onClick={handleProbeGenerate}
              disabled={!concept.trim() || isGenerating}
              className="k2v-mirror-cta"
            >
              {isGenerating ? '正在渲染...' : '✨ 在线生成'}
            </button>
          </div>
        </section>

        {(isGenerating || modelHash) && (
          <main className="k2v-mirror-stage">
            {isGenerating || (modelHash && !iframeHtml) ? (
              <div className="k2v-mirror-loading">
                <div className="k2v-mirror-halo" />
                <div className="k2v-mirror-spinner" />
                <p className="k2v-mirror-loading-title">正在渲染空间资产...</p>
                {logs.length > 0 ? (
                  <p className="k2v-mirror-loading-msg">{logs[logs.length - 1]}</p>
                ) : null}
              </div>
            ) : (
              <iframe title="3D Sandbox Result" srcDoc={iframeHtml} className="k2v-mirror-iframe" />
            )}
          </main>
        )}

        <section className="k2v-mirror-assets">
          <h3 className="k2v-mirror-assets-title">生成历史</h3>
          <div className="k2v-mirror-grid">
            {historyModels.length === 0 ? (
              <article className="k2v-mirror-card">
                <div className="k2v-mirror-card-cover">
                  <span className="k2v-mirror-cube-badge" aria-hidden="true">
                    ◻
                  </span>
                  <div className="k2v-mirror-card-placeholder">3D</div>
                </div>
                <p className="k2v-mirror-card-title">暂无生成历史</p>
              </article>
            ) : (
              historyModels.map((item) => (
                <article
                  key={item.hash}
                  className="k2v-mirror-card k2v-mirror-card-clickable"
                  onClick={() => handleRecallModel(item.hash, item.concept)}
                >
                  {getSemanticCover(item.concept, item.hash)}
                  <p className="k2v-mirror-card-title">{item.concept}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </ImmersiveLayout>
  )
}

export default Sandbox3D
