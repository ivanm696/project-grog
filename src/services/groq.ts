import { Message, GeneratedProject } from '../App';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  response: string;
  project: GeneratedProject;
}

const parseFilesFromResponse = (content: string): GeneratedProject['files'] => {
  const files: GeneratedProject['files'] = [];

  const fileMatches = content.matchAll(
    /```(?:json)?\s*\{[\s\S]*?\}\s*```/g
  );

  for (const match of fileMatches) {
    try {
      const jsonStr = match[0]
        .replace(/^```(?:json)?\s*/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(jsonStr);

      if (parsed.files && Array.isArray(parsed.files)) {
        files.push(...parsed.files);
      }
    } catch (e) {
      console.warn('Не удалось распарсить файлы:', e);
    }
  }

  if (files.length === 0) {
    const codeBlocks = content.matchAll(/```(\w+)?\n([\s\S]*?)```/g);

    let fileCounter = 0;
    for (const match of codeBlocks) {
      const language = match[1] || 'txt';
      const codeContent = match[2];

      fileCounter++;
      let path = `generated_file_${fileCounter}`;

      if (language === 'javascript' || language === 'js') {
        path = `script_${fileCounter}.js`;
      } else if (language === 'typescript' || language === 'ts') {
        path = `script_${fileCounter}.ts`;
      } else if (language === 'jsx') {
        path = `component_${fileCounter}.jsx`;
      } else if (language === 'tsx') {
        path = `component_${fileCounter}.tsx`;
      } else if (language === 'html') {
        path = `page_${fileCounter}.html`;
      } else if (language === 'css') {
        path = `style_${fileCounter}.css`;
      } else if (language === 'json') {
        path = `data_${fileCounter}.json`;
      } else if (language === 'python') {
        path = `script_${fileCounter}.py`;
      }

      files.push({
        path,
        content: codeContent,
      });
    }
  }

  return files;
};

export const generateProjectWithGroq = async (
  userMessage: string,
  previousMessages: Message[]
): Promise<GroqResponse> => {
  const conversationHistory = previousMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  const systemPrompt = `Ты - AI помощник для генерации кода и файлов.
Когда пользователь просит создать проект, код или файлы, ты должен:

1. Генерировать полностью рабочий код
2. Структурировать файлы логически (с папками через "/")
3. Предоставлять полный, готовый к использованию код

Ответ должен быть на русском языке и содержать:
- Объяснение того, что было создано
- JSON блок со всеми файлами в формате:
\`\`\`json
{
  "files": [
    {"path": "папка/файл.расширение", "content": "код или текст"},
    {"path": "другой_файл.js", "content": "код"}
  ]
}
\`\`\`

Или просто предоставляй код блоками \`\`\`язык ... \`\`\``;

  const messages = [
    ...conversationHistory,
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Ошибка API Groq');
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    const files = parseFilesFromResponse(assistantResponse);

    return {
      response: assistantResponse,
      project: {
        files,
      },
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Ошибка при обращении к API'
    );
  }
};
