import { useState, useRef, useEffect } from 'react';
import { Send, Download, Loader } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { generateProjectWithGroq } from './services/groq';
import { createZipArchive } from './services/zipService';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeneratedProject {
  files: Array<{
    path: string;
    content: string;
  }>;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await generateProjectWithGroq(input, messages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setGeneratedProject(result.project);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!generatedProject) return;

    try {
      await createZipArchive(generatedProject.files);
    } catch (error) {
      console.error('Ошибка при создании ZIP:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">AI Code Generator</h1>
          <p className="text-slate-400 text-sm">Генерирует файлы и архивирует их в ZIP</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-slate-400 text-lg">Напиши запрос для генерации кода</p>
                <p className="text-slate-500 text-sm mt-2">Например: "Создай React компонент для TODO списка"</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatInterface key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 text-slate-200 px-4 py-3 rounded-lg flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>AI генерирует код...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border-t border-slate-700/50 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 mb-3">
            {generatedProject && (
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать ZIP
              </button>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напиши что создать..."
              className="flex-1 bg-slate-700 border border-slate-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
