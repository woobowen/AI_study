import { API_PREFIX } from '../../config/api'
import type { Sandbox3DGeneratePayload } from './types'

/** 3D 沙盒流式回调契约 */
export interface Sandbox3DStreamCallbacks {
  /** 进度事件回调 */
  onProgress: (msg: string) => void
  /** 错误事件回调 */
  onError: (err: string) => void
  /** 完成事件回调（返回产物哈希） */
  onComplete: (hash: string) => void
}

/** SSE 数据包最小结构 */
interface Sandbox3DStreamPacket {
  type?: string
  message?: string
  htmlSha256?: string
  [key: string]: unknown
}

/**
 * 将前端画像适配为 3D 沙盒后端载荷结构
 */
export function adaptSandbox3DPayload(
  concept: string,
  difficulty: string,
  frontendProfile: any,
  masteredKnowledge: string[],
): Sandbox3DGeneratePayload {
  // 1. 精准提取前端真实字段（防空值与类型兜底）
  const age = Math.max(0, Number(frontendProfile?.age) || 20)
  // 解除硬编码，透传真实性别
  const gender = String(frontendProfile?.gender || '未知').trim()
  const language = String(frontendProfile?.language || 'Python').trim()
  const duration = String(frontendProfile?.duration || '短期').trim()

  // 2. 完美复刻前端的 profile_text 缝合逻辑，映射到 3D 引擎的 learningGoal
  const supplements = String(frontendProfile?.supplements || frontendProfile?.profile_summary || '').trim()
  const masteredList = Array.isArray(masteredKnowledge)
    ? masteredKnowledge.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : []

  let learningGoal = supplements
  if (masteredList.length > 0) {
    learningGoal += `\n该用户已掌握知识点：[${masteredList.join(', ')}]`
  }

  return {
    concept,
    userProfile: {
      age: age,
      gender: gender,
      programmingLanguage: language, // 完美对齐后端 Sandbox3DBackendProfile 的 key
      studyCycle: duration, // duration 映射到 studyCycle
      difficulty: difficulty,
      learningGoal: learningGoal.trim() || '无特定补充说明',
    },
  }
}

/**
 * 发起 3D 沙盒生成并消费 SSE 流
 */
export async function generate3DModelStream(
  concept: string,
  difficulty: string,
  frontendProfile: any,
  masteredKnowledge: string[],
  callbacks: Sandbox3DStreamCallbacks,
): Promise<void> {
  const payload = adaptSandbox3DPayload(concept, difficulty, frontendProfile, masteredKnowledge)
  const response = await fetch(`${API_PREFIX.SANDBOX3D}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const message = `3D Sandbox 请求失败: HTTP ${response.status}${errorText ? ` - ${errorText}` : ''}`
    callbacks.onError(message)
    throw new Error(message)
  }

  if (!response.body) {
    const message = '3D Sandbox 响应体为空，无法解析 SSE 流'
    callbacks.onError(message)
    throw new Error(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  let buffer = ''

  /**
   * 解析并分发单行 SSE data 事件
   * 约束：单次 JSON 解析失败仅告警，不中断整条流
   */
  const dispatchDataLine = (rawData: string): void => {
    if (!rawData || rawData === '[DONE]') return

    let parsed: Sandbox3DStreamPacket
    try {
      parsed = JSON.parse(rawData) as Sandbox3DStreamPacket
    } catch (error) {
      console.warn('3D Sandbox SSE JSON 解析失败，已跳过该事件行:', rawData, error)
      return
    }

    if (parsed.type === 'progress') {
      callbacks.onProgress(String(parsed.message ?? ''))
      return
    }

    if (parsed.type === 'error') {
      callbacks.onError(String(parsed.message ?? '3D Sandbox 生成异常'))
      return
    }

    if (parsed.type === 'complete') {
      callbacks.onComplete(String(parsed.htmlSha256 ?? ''))
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        const tailLines = buffer.replace(/\r\n/g, '\n').split('\n')
        for (const line of tailLines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data:')) {
            dispatchDataLine(trimmed.slice(5).trim())
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('data:')) {
          dispatchDataLine(trimmed.slice(5).trim())
        }
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '3D Sandbox SSE 连接异常（疑似网络中断）'
    callbacks.onError(message)
    throw error instanceof Error ? error : new Error(message)
  }
}
