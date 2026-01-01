import { Message } from '../App';
import { User, Bot } from 'lucide-react';

interface ChatInterfaceProps {
  message: Message;
}

function ChatInterface({ message }: ChatInterfaceProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-blue-600'
              : 'bg-slate-700'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        <div
          className={`px-4 py-3 rounded-lg break-words ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-200'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <span className="text-xs opacity-70 mt-2 block">
            {message.timestamp.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
