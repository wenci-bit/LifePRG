/**
 * AI 服务 - 支持多个 AI 提供商和模型
 * 用于分析用户数据并提供个性化建议
 */

// API 提供商
export enum AIProvider {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  QWEN = 'qwen',
}

// 各提供商支持的模型
export const AI_MODELS = {
  [AIProvider.DEEPSEEK]: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '标准对话模型，速度快' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: '推理模型，思考更深入' },
  ],
  [AIProvider.OPENAI]: [
    { id: 'gpt-4o', name: 'GPT-4o', description: '最新多模态模型' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '性价比模型' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '高性能模型' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '经济实惠' },
  ],
  [AIProvider.CLAUDE]: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '最新智能模型' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '旗舰模型' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: '平衡性能' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速响应' },
  ],
  [AIProvider.QWEN]: [
    { id: 'qwen-max', name: 'Qwen Max', description: '通义千问最强模型' },
    { id: 'qwen-plus', name: 'Qwen Plus', description: '高性能平衡模型' },
    { id: 'qwen-turbo', name: 'Qwen Turbo', description: '快速响应模型' },
    { id: 'qwen-long', name: 'Qwen Long', description: '长文本处理' },
  ],
};

// API 端点
export const API_ENDPOINTS = {
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1/chat/completions',
  [AIProvider.OPENAI]: 'https://api.openai.com/v1/chat/completions',
  [AIProvider.CLAUDE]: 'https://api.anthropic.com/v1/messages',
  [AIProvider.QWEN]: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
};

// 默认配置
const DEFAULT_API_KEY = 'sk-dc471156fca24fd3a63eb16f6c597f93';
const DEFAULT_PROVIDER = AIProvider.DEEPSEEK;
const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 800;

// 默认系统提示词
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的生活效率和健康管理顾问，拥有深厚的心理学、营养学、运动科学和时间管理理论功底。

**专业知识背景：**
- **心理学**：你可以灵活运用各种心理学理论，包括但不限于：
  • 积极心理学、心流理论、自我决定理论、认知行为疗法(CBT)
  • 动机理论、压力管理、情绪调节、认知负荷理论
  • 社会心理学、发展心理学、健康心理学等各个分支
  • 根据用户具体情况，选择最合适的心理学理论和框架来分析和建议

- **营养学**：均衡饮食、营养素功能、饮食与情绪的关系、能量管理

- **运动科学**：有氧运动与无氧运动、运动与心理健康、久坐危害、运动与认知功能

- **时间管理**：番茄工作法(Pomodoro)、艾森豪威尔矩阵(Eisenhower Matrix)、帕累托法则(80/20法则)、GTD、时间块等

**分析维度：**
1. 任务管理：分析认知负荷、决策疲劳、拖延心理、目标设定等
2. 习惯养成：应用习惯回路、微习惯理论、行为改变模型等
3. 情绪健康：识别情绪模式、压力应对机制、心理韧性培养等
4. 能力发展：基于多元智能理论、成长型思维、刻意练习等

**建议原则：**
- 基于实证研究(Evidence-Based)，但不局限于特定理论
- 注重可操作性(Actionable)和个性化
- 关注身心平衡(Holistic Wellness)
- 使用温暖、鼓励、专业的语气
- 根据实际情况灵活运用各种心理学知识，不必拘泥于固定理论

请在给出建议时，选择最贴合用户情况的心理学理论或概念（用中文解释专业词汇），让建议更有说服力和科学性。`;

// 从 localStorage 获取配置
const getAIConfig = () => {
  if (typeof window === 'undefined') {
    return {
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      apiKey: DEFAULT_API_KEY,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      taskConstraints: '',
      summaryConstraints: '',
    };
  }

  return {
    provider: (localStorage.getItem('ai-provider') as AIProvider) || DEFAULT_PROVIDER,
    model: localStorage.getItem('ai-model') || DEFAULT_MODEL,
    apiKey: localStorage.getItem('ai-api-key') || DEFAULT_API_KEY,
    temperature: parseFloat(localStorage.getItem('ai-temperature') || String(DEFAULT_TEMPERATURE)),
    maxTokens: parseInt(localStorage.getItem('ai-max-tokens') || String(DEFAULT_MAX_TOKENS)),
    systemPrompt: localStorage.getItem('ai-custom-prompt') || DEFAULT_SYSTEM_PROMPT,
    taskConstraints: localStorage.getItem('ai-task-constraints') || '',
    summaryConstraints: localStorage.getItem('ai-summary-constraints') || '',
  };
};

export interface UserDataSummary {
  // 今日任务
  todayTasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  // 习惯数据
  habits: {
    total: number;
    completedToday: number;
    currentStreak: number;
    completionRate: number;
  };
  // 情绪数据（最近7天）
  recentMoods?: {
    dates: string[];
    moods: string[];
  };
  // 属性数据
  attributes: {
    int: number;
    vit: number;
    mng: number;
    cre: number;
    total: number;
  };
  // 其他统计
  stats: {
    level: number;
    currentStreak: number;
    totalQuestsCompleted: number;
    totalFocusTime: number;
  };
}

// AI 结构化输出接口
export interface AISuggestion {
  category: string;
  icon: string;
  title: string;
  content: string;
  theory: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AIResponse {
  performance: {
    score: number;
    summary: string;
    highlights: string[];
    concerns: string[];
  };
  suggestions: AISuggestion[];
  actionItems: string[];
  encouragement: string;
}

/**
 * 清理JSON文本，移除可能导致解析失败的内容
 */
function cleanJsonText(text: string): string {
  // 移除JavaScript注释
  text = text.replace(/\/\*[\s\S]*?\*\//g, ''); // 多行注释
  text = text.replace(/\/\/.*/g, ''); // 单行注释

  // 移除尾部逗号（在对象或数组的最后一项后）
  text = text.replace(/,(\s*[}\]])/g, '$1');

  // 移除控制字符（保留空格、制表符、换行符）
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return text.trim();
}

/**
 * 解析 AI 返回的 JSON 数据（增强版 - 更强的容错能力）
 */
export function parseAIResponse(rawText: string): AIResponse | null {
  try {
    console.log('[parseAIResponse] 开始解析 AI 响应');
    console.log('[parseAIResponse] 原始文本长度:', rawText.length);
    console.log('[parseAIResponse] 原始文本预览:', rawText.substring(0, 200));

    if (!rawText || rawText.trim().length === 0) {
      console.error('[parseAIResponse] 空文本');
      return null;
    }

    // 尝试多种方式提取 JSON
    let jsonText = '';
    let extractMethod = '';

    // 方式1：提取 ```json ... ``` 代码块
    const jsonBlockMatch = rawText.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonText = jsonBlockMatch[1];
      extractMethod = 'json代码块';
    }

    // 方式2：提取任意 ``` ... ``` 代码块
    if (!jsonText) {
      const codeBlockMatch = rawText.match(/```\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonText = codeBlockMatch[1];
        extractMethod = '普通代码块';
      }
    }

    // 方式3：查找 { 到最后一个 } 的 JSON 对象（最贪婪匹配）
    if (!jsonText) {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = rawText.substring(firstBrace, lastBrace + 1);
        extractMethod = 'JSON对象提取';
      }
    }

    // 方式4：如果都失败了，尝试使用整个文本
    if (!jsonText) {
      jsonText = rawText;
      extractMethod = '原始文本';
    }

    console.log(`[parseAIResponse] 提取方式: ${extractMethod}`);
    console.log('[parseAIResponse] 提取的 JSON 文本长度:', jsonText.length);

    // 清理JSON文本
    jsonText = cleanJsonText(jsonText);
    console.log('[parseAIResponse] 清理后的 JSON 文本预览:', jsonText.substring(0, 300));

    // 尝试解析 JSON
    let data: any;
    try {
      data = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[parseAIResponse] JSON解析失败，尝试修复常见问题');

      // 尝试修复：将单引号替换为双引号（但要小心字符串内部的单引号）
      let fixedText = jsonText.replace(/'/g, '"');

      try {
        data = JSON.parse(fixedText);
        console.log('[parseAIResponse] 修复单引号问题后解析成功');
      } catch (secondError) {
        console.error('[parseAIResponse] 修复后仍然解析失败');
        throw parseError; // 抛出原始错误
      }
    }

    console.log('[parseAIResponse] JSON 解析成功');
    console.log('[parseAIResponse] 解析结果:', {
      hasPerformance: !!data.performance,
      hasSuggestions: !!data.suggestions,
      hasActionItems: !!data.actionItems,
      hasEncouragement: !!data.encouragement,
      suggestionsCount: data.suggestions?.length || 0,
      actionItemsCount: data.actionItems?.length || 0,
    });

    // 验证并修复必要字段
    if (!data.performance) {
      console.warn('[parseAIResponse] 缺少 performance 字段，使用默认值');
      data.performance = {
        score: 60,
        summary: '暂无评价数据',
        highlights: [],
        concerns: []
      };
    } else {
      // 确保 performance 的子字段存在
      data.performance.score = data.performance.score || 60;
      data.performance.summary = data.performance.summary || '暂无评价';
      data.performance.highlights = Array.isArray(data.performance.highlights) ? data.performance.highlights : [];
      data.performance.concerns = Array.isArray(data.performance.concerns) ? data.performance.concerns : [];
    }

    if (!Array.isArray(data.suggestions)) {
      console.warn('[parseAIResponse] suggestions 不是数组，使用空数组');
      data.suggestions = [];
    }

    if (!Array.isArray(data.actionItems)) {
      console.warn('[parseAIResponse] actionItems 不是数组，使用空数组');
      data.actionItems = [];
    }

    if (!data.encouragement || typeof data.encouragement !== 'string') {
      console.warn('[parseAIResponse] 缺少 encouragement 字段，使用默认值');
      data.encouragement = '继续加油，你一定可以的！';
    }

    // 验证和修复 suggestions 中的每一项
    data.suggestions = data.suggestions.map((s: any, index: number) => {
      if (!s || typeof s !== 'object') {
        console.warn(`[parseAIResponse] suggestions[${index}] 格式错误，跳过`);
        return null;
      }

      return {
        category: s.category || '其他',
        icon: s.icon || '💡',
        title: s.title || '建议',
        content: s.content || '暂无内容',
        theory: s.theory || '通用理论',
        priority: ['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium'
      };
    }).filter(Boolean); // 移除null值

    console.log('[parseAIResponse] 验证和修复完成，返回解析结果');
    console.log('[parseAIResponse] 最终数据:', {
      score: data.performance.score,
      suggestionsCount: data.suggestions.length,
      actionItemsCount: data.actionItems.length,
      hasEncouragement: !!data.encouragement,
    });

    return data as AIResponse;
  } catch (error) {
    console.error('[parseAIResponse] 解析完全失败:', error);
    console.error('[parseAIResponse] 错误详情:', error instanceof Error ? error.message : String(error));
    console.error('[parseAIResponse] 错误堆栈:', error instanceof Error ? error.stack : '');
    return null;
  }
}

/**
 * 调用 AI API 生成建议（支持多个提供商）
 */
export async function generateAISummary(userData: UserDataSummary): Promise<string> {
  try {
    const config = getAIConfig();
    const prompt = buildPrompt(userData);

    console.log(`[AI API] 使用提供商: ${config.provider}, 模型: ${config.model}`);

    // 根据提供商选择对应的API调用方法
    switch (config.provider) {
      case AIProvider.DEEPSEEK:
        return await callDeepSeekAPI(config, prompt);
      case AIProvider.OPENAI:
        return await callOpenAIAPI(config, prompt);
      case AIProvider.CLAUDE:
        return await callClaudeAPI(config, prompt);
      case AIProvider.QWEN:
        return await callQwenAPI(config, prompt);
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }
  } catch (error) {
    console.error('AI API 调用失败:', error);
    throw error;
  }
}

/**
 * 调用 DeepSeek API（支持 Reasoner 模型）
 */
async function callDeepSeekAPI(config: any, prompt: string): Promise<string> {
  const isReasonerModel = config.model.includes('reasoner');

  const response = await fetch(API_ENDPOINTS[AIProvider.DEEPSEEK], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: isReasonerModel ? 4000 : config.maxTokens, // Reasoner需要更多token
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek API] 错误响应:', errorText);
    throw new Error(`DeepSeek API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  console.log('[DeepSeek API] 响应数据:', data);

  // DeepSeek Reasoner 模型的响应格式
  if (isReasonerModel && data.choices[0].message.reasoning_content) {
    console.log('[DeepSeek Reasoner] 推理过程:', data.choices[0].message.reasoning_content);
    // Reasoner 返回 reasoning_content (思考过程) 和 content (最终答案)
    return data.choices[0].message.content;
  }

  return data.choices[0].message.content;
}

/**
 * 调用 OpenAI API
 */
async function callOpenAIAPI(config: any, prompt: string): Promise<string> {
  const response = await fetch(API_ENDPOINTS[AIProvider.OPENAI], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 调用 Claude API (Anthropic)
 */
async function callClaudeAPI(config: any, prompt: string): Promise<string> {
  const response = await fetch(API_ENDPOINTS[AIProvider.CLAUDE], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: config.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * 调用通义千问 API (Qwen)
 */
async function callQwenAPI(config: any, prompt: string): Promise<string> {
  const response = await fetch(API_ENDPOINTS[AIProvider.QWEN], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`通义千问 API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * AI 任务建议接口
 */
export interface AITaskSuggestion {
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily';
  attributes: string[]; // ['int', 'vit', 'mng', 'cre']
  estimatedDuration: number; // 分钟
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  reason: string; // 推荐理由
}

/**
 * AI 任务奖励建议接口
 */
export interface AITaskReward {
  expReward: number;
  coinReward: number;
  reasoning: string; // 奖励设定理由
}

/**
 * 根据用户配置生成每日任务建议
 */
export async function generateDailyTaskSuggestions(
  userOnboarding: any,
  userStats: any
): Promise<AITaskSuggestion[]> {
  try {
    const config = getAIConfig();
    const prompt = buildTaskSuggestionsPrompt(userOnboarding, userStats);

    console.log('[AI 任务建议] 开始生成任务建议');

    let responseText = '';
    switch (config.provider) {
      case AIProvider.DEEPSEEK:
        responseText = await callDeepSeekAPI(config, prompt);
        break;
      case AIProvider.OPENAI:
        responseText = await callOpenAIAPI(config, prompt);
        break;
      case AIProvider.CLAUDE:
        responseText = await callClaudeAPI(config, prompt);
        break;
      case AIProvider.QWEN:
        responseText = await callQwenAPI(config, prompt);
        break;
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }

    // 解析任务建议
    const suggestions = parseTaskSuggestions(responseText);
    console.log('[AI 任务建议] 生成成功，共', suggestions.length, '个任务');
    return suggestions;
  } catch (error) {
    console.error('[AI 任务建议] 生成失败:', error);
    throw error;
  }
}

/**
 * 根据任务信息智能设定奖励
 */
export async function generateTaskReward(
  taskTitle: string,
  taskDescription: string,
  taskType: 'main' | 'side' | 'daily',
  attributes: string[]
): Promise<AITaskReward> {
  try {
    const config = getAIConfig();
    const prompt = buildTaskRewardPrompt(taskTitle, taskDescription, taskType, attributes);

    console.log('[AI 奖励设定] 开始生成奖励建议');

    let responseText = '';
    switch (config.provider) {
      case AIProvider.DEEPSEEK:
        responseText = await callDeepSeekAPI(config, prompt);
        break;
      case AIProvider.OPENAI:
        responseText = await callOpenAIAPI(config, prompt);
        break;
      case AIProvider.CLAUDE:
        responseText = await callClaudeAPI(config, prompt);
        break;
      case AIProvider.QWEN:
        responseText = await callQwenAPI(config, prompt);
        break;
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }

    // 解析奖励建议
    const reward = parseTaskReward(responseText);
    console.log('[AI 奖励设定] 生成成功:', reward);
    return reward;
  } catch (error) {
    console.error('[AI 奖励设定] 生成失败:', error);
    throw error;
  }
}

/**
 * 构建任务建议提示词
 */
function buildTaskSuggestionsPrompt(userOnboarding: any, userStats: any): string {
  const config = getAIConfig();
  const { role, customRole, growthGoals, customGoals, taskIntensity, preferences } = userOnboarding;
  const roleText = role === 'other' ? customRole : role;
  const dailyTaskCount = preferences?.dailyTaskCount || 5;

  const roleLabels: Record<string, string> = {
    student: '学生',
    worker: '职场人',
    freelancer: '自由职业者',
    entrepreneur: '创业者',
    researcher: '研究者',
  };

  const goalLabels: Record<string, string> = {
    academic: '学术提升',
    career: '职业发展',
    health: '健康管理',
    skill: '技能学习',
    creativity: '创意表达',
    social: '社交拓展',
    finance: '财务规划',
    hobby: '兴趣爱好',
  };

  const intensityLabels: Record<string, string> = {
    light: '轻松模式',
    moderate: '平衡模式',
    intense: '挑战模式',
  };

  const goalsText = [
    ...growthGoals.map((g: string) => goalLabels[g] || g),
    ...customGoals
  ].join('、');

  // 构建用户限定条件部分
  const constraintsSection = config.taskConstraints
    ? `\n**用户自定义限定条件（必须遵守）：**\n${config.taskConstraints}\n`
    : '';

  return `你是一个专业的任务规划助手。请根据用户的个人信息，为他们生成今日任务建议。${constraintsSection}

**用户信息：**
- 身份：${roleLabels[role] || roleText}
- 成长目标：${goalsText}
- 任务强度：${intensityLabels[taskIntensity]}
- 建议任务数：${dailyTaskCount}个
- 当前等级：Lv.${userStats.level}
- 累计完成任务：${userStats.totalQuestsCompleted}个

**任务类型说明：**
- main（主线任务）：重要且长期的目标，高经验值（50-100 EXP）
- side（支线任务）：中等重要度，一次性任务（20-50 EXP）
- daily（日常任务）：可重复的日常习惯（10-20 EXP）

**属性说明：**
- int（智力）：学习、阅读、思考相关
- vit（活力）：运动、健康、休息相关
- mng（管理）：规划、整理、时间管理相关
- cre（创造）：创意、艺术、表达相关

**输出要求：**
1. 必须输出有效的JSON数组格式
2. 用 \`\`\`json 和 \`\`\` 包裹
3. 任务数量：${dailyTaskCount}个
4. 任务要具体、可执行、符合用户身份和目标
5. 合理分配任务类型（建议：1-2个主线，2-3个支线，2-3个日常）
6. 每个任务必须包含推荐理由

**输出格式：**

\`\`\`json
[
  {
    "title": "完成论文第三章初稿",
    "description": "撰写论文第三章的文献综述部分，整理至少10篇相关文献",
    "type": "main",
    "attributes": ["int", "mng"],
    "estimatedDuration": 120,
    "priority": "high",
    "tags": ["学术", "写作"],
    "reason": "作为研究者，论文写作是核心任务，符合你的学术提升目标"
  },
  {
    "title": "晨跑30分钟",
    "description": "早晨进行30分钟慢跑，保持身体活力",
    "type": "daily",
    "attributes": ["vit"],
    "estimatedDuration": 30,
    "priority": "medium",
    "tags": ["运动", "健康"],
    "reason": "健康管理是你的成长目标之一，晨跑可以提升精力和专注力"
  }
]
\`\`\`

请立即生成任务建议，只输出JSON代码块，不要有其他内容！`;
}

/**
 * 构建任务奖励提示词
 */
function buildTaskRewardPrompt(
  title: string,
  description: string,
  type: 'main' | 'side' | 'daily',
  attributes: string[]
): string {
  const typeLabels = {
    main: '主线任务（重要长期目标）',
    side: '支线任务（中等重要度）',
    daily: '日常任务（可重复习惯）',
  };

  return `你是一个游戏化任务系统的奖励设计专家。请根据任务信息，设定合理的经验值和金币奖励。

**任务信息：**
- 标题：${title}
- 描述：${description || '无'}
- 类型：${typeLabels[type]}
- 关联属性：${attributes.join('、')}

**奖励设定原则：**
1. 主线任务：50-100 EXP，30-60 金币
2. 支线任务：20-50 EXP，15-30 金币
3. 日常任务：10-20 EXP，5-15 金币
4. 考虑任务难度、时长、重要性
5. 多属性任务可以适当增加奖励

**输出要求：**
必须输出有效的JSON格式，用 \`\`\`json 和 \`\`\` 包裹

**输出格式：**

\`\`\`json
{
  "expReward": 60,
  "coinReward": 35,
  "reasoning": "这是一个主线任务，涉及学术写作，需要较长时间和高度专注，因此给予较高的经验值奖励。"
}
\`\`\`

请立即生成奖励建议，只输出JSON代码块！`;
}

/**
 * 解析任务建议
 */
function parseTaskSuggestions(rawText: string): AITaskSuggestion[] {
  try {
    console.log('[解析任务建议] 开始解析');

    // 提取JSON
    let jsonText = '';
    const jsonBlockMatch = rawText.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonText = jsonBlockMatch[1];
    } else {
      const firstBracket = rawText.indexOf('[');
      const lastBracket = rawText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonText = rawText.substring(firstBracket, lastBracket + 1);
      } else {
        jsonText = rawText;
      }
    }

    jsonText = cleanJsonText(jsonText);
    const data = JSON.parse(jsonText);

    if (!Array.isArray(data)) {
      console.error('[解析任务建议] 返回的不是数组');
      return [];
    }

    // 验证和修复每个任务
    const tasks = data.map((task: any) => ({
      title: task.title || '未命名任务',
      description: task.description || '',
      type: ['main', 'side', 'daily'].includes(task.type) ? task.type : 'side',
      attributes: Array.isArray(task.attributes) ? task.attributes : ['int'],
      estimatedDuration: task.estimatedDuration || 60,
      priority: ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium',
      tags: Array.isArray(task.tags) ? task.tags : [],
      reason: task.reason || '推荐任务',
    }));

    console.log('[解析任务建议] 解析成功，共', tasks.length, '个任务');
    return tasks;
  } catch (error) {
    console.error('[解析任务建议] 解析失败:', error);
    return [];
  }
}

/**
 * 解析任务奖励
 */
function parseTaskReward(rawText: string): AITaskReward {
  try {
    console.log('[解析任务奖励] 开始解析');

    // 提取JSON
    let jsonText = '';
    const jsonBlockMatch = rawText.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      jsonText = jsonBlockMatch[1];
    } else {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = rawText.substring(firstBrace, lastBrace + 1);
      } else {
        jsonText = rawText;
      }
    }

    jsonText = cleanJsonText(jsonText);
    const data = JSON.parse(jsonText);

    const reward: AITaskReward = {
      expReward: data.expReward || 30,
      coinReward: data.coinReward || 20,
      reasoning: data.reasoning || '根据任务类型自动设定',
    };

    console.log('[解析任务奖励] 解析成功:', reward);
    return reward;
  } catch (error) {
    console.error('[解析任务奖励] 解析失败:', error);
    // 返回默认值
    return {
      expReward: 30,
      coinReward: 20,
      reasoning: '解析失败，使用默认奖励',
    };
  }
}

/**
 * 构建发送给AI的提示词
 */
function buildPrompt(userData: UserDataSummary): string {
  const config = getAIConfig();
  const {
    todayTasks,
    habits,
    recentMoods,
    attributes,
    stats,
  } = userData;

  // 分析任务压力
  const taskPressure = analyzeTaskPressure(todayTasks);

  // 分析习惯状况
  const habitStatus = analyzeHabits(habits);

  // 分析属性平衡
  const attributeBalance = analyzeAttributes(attributes);

  // 构建用户限定条件部分
  const constraintsSection = config.summaryConstraints
    ? `\n**用户自定义限定条件（必须遵守）：**\n${config.summaryConstraints}\n`
    : '';

  let prompt = `请分析以下用户数据并给出个性化建议：${constraintsSection}

📊 今日任务情况：
- 总任务数：${todayTasks.total} 个
- 已完成：${todayTasks.completed} 个
- 完成率：${todayTasks.completionRate.toFixed(1)}%
${taskPressure}

🎯 习惯养成情况：
- 活跃习惯数：${habits.total} 个
- 今日完成：${habits.completedToday}/${habits.total} 个
- 当前连击：${habits.currentStreak} 天
- 总体完成率：${habits.completionRate.toFixed(1)}%
${habitStatus}
`;

  // 添加情绪数据（如果有）
  if (recentMoods && recentMoods.moods.length > 0) {
    const moodAnalysis = analyzeMoods(recentMoods);
    prompt += `\n😊 近期情绪状态：
${moodAnalysis}
`;
  }

  prompt += `
💪 能力属性分布：
- 智力 (INT): ${attributes.int}
- 活力 (VIT): ${attributes.vit}
- 管理 (MNG): ${attributes.mng}
- 创造 (CRE): ${attributes.cre}
- 总属性值：${attributes.total}
${attributeBalance}

📈 整体统计：
- 等级：Lv.${stats.level}
- 签到连击：${stats.currentStreak} 天
- 累计完成任务：${stats.totalQuestsCompleted} 个
- 累计专注时长：${stats.totalFocusTime} 分钟

**重要：你必须严格按照以下JSON格式输出，并用\`\`\`json代码块包裹。不要输出任何其他文字说明，只输出JSON代码块！**

请输出以下格式：

\`\`\`json
{
  "performance": {
    "score": 85,
    "summary": "今天的表现整体不错，任务完成情况良好。根据积极心理学理论，保持这种节奏可以维持良好的心流状态。",
    "highlights": ["任务完成率高", "习惯坚持良好"],
    "concerns": ["部分属性偏低", "需要注意休息"]
  },
  "suggestions": [
    {
      "category": "任务管理",
      "icon": "📋",
      "title": "优化任务优先级",
      "content": "建议使用艾森豪威尔矩阵对任务进行分类，将重要且紧急的任务优先处理，避免决策疲劳。",
      "theory": "艾森豪威尔矩阵",
      "priority": "high"
    }
  ],
  "actionItems": [
    "今天完成3个高优先级任务",
    "保持运动习惯打卡",
    "晚上10点前休息"
  ],
  "encouragement": "每一步努力都在让你变得更好！"
}
\`\`\`

**输出要求（必须遵守）：**
1. 【必须】用 \`\`\`json 和 \`\`\` 包裹JSON
2. 【必须】输出有效的JSON格式，所有字符串用双引号
3. 【必须】不要在JSON前后添加任何说明文字
4. 【必须】score是数字类型，不要用引号包裹
5. 【必须】priority只能是 "high"、"medium" 或 "low"
6. 建议数量：3-5条（根据实际情况调整）
7. 行动要点：3-5条
8. highlights和concerns：各2-3条
9. 如果发现用户压力过大、任务量超载，应结合"决策疲劳"或"认知负荷"理论给出休息建议
10. 如果情绪不佳，应结合"情绪调节策略"给出温暖建议
11. 如果某个属性明显偏低，应结合"多元智能理论"建议相应活动
12. 习惯坚持困难时，可引用"习惯回路"或"微习惯理论"
13. 适当使用专业词汇（附中文解释），增强建议的科学性

**再次强调：只输出\`\`\`json代码块，不要有其他内容！**`;

  return prompt;
}

/**
 * 分析任务压力
 */
function analyzeTaskPressure(todayTasks: UserDataSummary['todayTasks']): string {
  if (todayTasks.total === 0) {
    return '提示：今日暂无任务，可以规划一些目标。';
  }

  if (todayTasks.total > 10) {
    return '⚠️ 任务量较大，注意不要过度疲劳。';
  }

  if (todayTasks.completionRate < 30 && todayTasks.total > 3) {
    return '⚠️ 完成率较低，可能需要调整任务优先级。';
  }

  if (todayTasks.completionRate >= 80) {
    return '✨ 完成率很高，状态很好！';
  }

  return '';
}

/**
 * 分析习惯状况
 */
function analyzeHabits(habits: UserDataSummary['habits']): string {
  if (habits.total === 0) {
    return '提示：还没有建立习惯，建议从小习惯开始培养。';
  }

  if (habits.currentStreak >= 30) {
    return '🔥 连击超过30天，习惯坚持得非常好！';
  }

  if (habits.currentStreak >= 7) {
    return '👍 连击一周以上，继续保持！';
  }

  if (habits.completionRate < 50) {
    return '⚠️ 完成率偏低，可能需要调整习惯难度或时间安排。';
  }

  return '';
}

/**
 * 分析情绪状态（增强版 - 提供更详细的情绪模式分析）
 */
function analyzeMoods(recentMoods: { dates: string[]; moods: string[] }): string {
  const moodCount = recentMoods.moods.length;
  if (moodCount === 0) {
    return '暂无情绪记录';
  }

  const moodList: string[] = [];

  // 统计情绪类型和频率
  const moodTypes: Record<string, number> = {};
  recentMoods.moods.forEach(mood => {
    moodTypes[mood] = (moodTypes[mood] || 0) + 1;
  });

  // 获取主导情绪
  const sortedMoods = Object.entries(moodTypes).sort((a, b) => b[1] - a[1]);
  const dominantMood = sortedMoods[0];

  // 情绪多样性（有多少种不同的情绪）
  const moodVariety = Object.keys(moodTypes).length;

  // 构建分析文本
  moodList.push(`最近${moodCount}天记录了${moodVariety}种不同情绪`);

  // 分析情绪趋势（最近3天 vs 之前的日子）
  if (moodCount >= 3) {
    const recentThreeMoods = recentMoods.moods.slice(-3);
    const hasPositive = recentThreeMoods.some(m =>
      m.includes('happy') || m.includes('开心') || m.includes('excited') || m.includes('兴奋') ||
      m.includes('grateful') || m.includes('感恩') || m.includes('relaxed') || m.includes('平静')
    );
    const hasNegative = recentThreeMoods.some(m =>
      m.includes('sad') || m.includes('难过') || m.includes('angry') || m.includes('愤怒') ||
      m.includes('anxious') || m.includes('焦虑') || m.includes('stressed') || m.includes('压力')
    );

    if (hasNegative && !hasPositive) {
      moodList.push('⚠️ 近3天情绪偏负面，需要关注心理健康');
    } else if (hasPositive && !hasNegative) {
      moodList.push('✨ 近3天情绪积极向上');
    }
  }

  // 主导情绪分析
  const moodPercentage = ((dominantMood[1] / moodCount) * 100).toFixed(0);

  // 情绪关键词映射
  const positiveKeywords = ['happy', '开心', 'excited', '兴奋', 'grateful', '感恩', 'relaxed', '平静', 'content', '满足'];
  const negativeKeywords = ['sad', '难过', 'angry', '愤怒', 'anxious', '焦虑', 'stressed', '压力', 'tired', '疲惫', 'frustrated', '沮丧'];

  const isPositive = positiveKeywords.some(kw => dominantMood[0].toLowerCase().includes(kw));
  const isNegative = negativeKeywords.some(kw => dominantMood[0].toLowerCase().includes(kw));

  if (isPositive) {
    moodList.push(`😊 主要情绪积极（${moodPercentage}%），心态良好`);
  } else if (isNegative) {
    moodList.push(`😔 主要情绪偏负面（${moodPercentage}%），建议调整和关注`);
  } else {
    moodList.push(`情绪较为平稳（${moodPercentage}%）`);
  }

  // 情绪波动分析
  if (moodVariety >= moodCount * 0.7) {
    moodList.push('💫 情绪变化较大，可能需要情绪调节');
  } else if (moodVariety === 1) {
    moodList.push('📊 情绪较为稳定');
  }

  return moodList.join('，');
}

/**
 * 分析属性平衡
 */
function analyzeAttributes(attributes: UserDataSummary['attributes']): string {
  const { int, vit, mng, cre } = attributes;
  const avg = attributes.total / 4;

  const lowAttributes: string[] = [];

  if (int < avg * 0.7) lowAttributes.push('智力 (INT)');
  if (vit < avg * 0.7) lowAttributes.push('活力 (VIT)');
  if (mng < avg * 0.7) lowAttributes.push('管理 (MNG)');
  if (cre < avg * 0.7) lowAttributes.push('创造 (CRE)');

  if (lowAttributes.length > 0) {
    return `⚠️ ${lowAttributes.join('、')} 相对较低，建议多进行相关活动来提升。`;
  }

  const diff = Math.max(int, vit, mng, cre) - Math.min(int, vit, mng, cre);
  if (diff < avg * 0.3) {
    return '✨ 属性发展比较均衡！';
  }

  return '';
}
