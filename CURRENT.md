# CURRENT.md - 当前迭代周期战术板

## 当前阶段目标：全域 AI 异步任务调度中心 4.0 落地 (The Dispatch Center)

任务描述：重构 `src/store/useUserStore.ts`，建立“内存调度池 (Volatile)”与“持久化金库 (Persisted)”的双轨制状态机，并实装 `partialize` 物理防爆盾，为全工程所有 AI 模块提供统一的、具备跨页生存权与物理熔断能力的基建底座。

## 任务清单 (Task Checklist)

- [ ] 接口扩容 (Interface Expansion)：定义 `AIAssetInfo` 数据结构，并在 `UserStoreState` 中新增 `activeAITasks` 和 `aiAssets`。在 `UserStoreActions` 中声明三大调度神经元。

- [ ] 神经元实装 (Actions Implementation)：实现 `startAITask` (创建并返回 AbortSignal)、`abortAITask` (执行 .abort() 并清理内存)、`finishAITask` (清理内存并写入持久化资产池)。

- [ ] 物理防爆盾 (Partialize Shield)：在 `persist` 中间件中强行拦截序列化过程，剔除 `activeAITasks`，防止浏览器原生内存指针引发持久化崩溃。

## 执行路径 (Execution Path)

目标文件：`src/store/useUserStore.ts`

步骤 1：植入数据结构

```typescript
export interface AIAssetInfo {
  type: 'K2V' | 'C2V' | '3D';
  title: string;
  url: string;
  createdAt: number;
}

// 在 UserStoreState 接口中追加：
activeAITasks: Record<string, AbortController>;
aiAssets: Record<string, AIAssetInfo>;

// 在 UserStoreActions 接口中追加：
startAITask: (taskId: string) => AbortSignal;
abortAITask: (taskId: string) => void;
finishAITask: (taskId: string, asset: AIAssetInfo) => void;
```

步骤 2：实装底层逻辑

在 create<UserStore>()(...) 的初始状态中追加 activeAITasks: {}, aiAssets: {},。

在 set 逻辑中实现：

startAITask: 实例化 AbortController，保存到 activeAITasks，并返回其 signal。

abortAITask: 检查并执行 activeAITasks[taskId]?.abort()，随后将其从对象中 delete。

finishAITask: 将任务从 activeAITasks 中移除，并将完整的 asset 追加写入 aiAssets 字典。

步骤 3：挂载防御中间件 (极度危险)

找到文件底部的 persist 配置区域，精准插入 partialize：

```typescript
{
  name: 'ai-study-user-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => {
    const { activeAITasks, ...rest } = state;
    return rest;
  },
}
```

步骤 4：测试验证逻辑

执行 `npx tsc --noEmit` 确保 Zustand 类型推导闭环无报错。

(人工验证) 在控制台手动调用 `useUserStore.getState().startAITask('test_1')`，然后调用 `abortAITask('test_1')`，观察是否执行无误。执行 `window.location.reload()` 后确认 `aiAssets` 存活且 `activeAITasks` 销毁。
