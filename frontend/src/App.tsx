import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { MessageCircle, SmileIcon } from 'lucide-react';
import EmojiPicker, {
  EmojiStyle,
  SuggestionMode,
  Theme,
} from 'emoji-picker-react';

type ChatMessage = {
  source: 'client' | 'server';
  content: string;
  timestamp?: string;
};

function App() {
  const [userInput, setUserInput] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emoji, setEmoji] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.onopen = () => {
      console.log('Connected');
      setSocket(ws);
    };

    ws.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        const serverMsg = parsed.message;
        setMessages((prev) => [
          ...prev,
          {
            source: 'server',
            content: serverMsg,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            source: 'server',
            content: msg.data,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmoji(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    if (socket && userInput.trim()) {
      socket.send(userInput);
      setMessages((prev) => [
        ...prev,
        {
          source: 'client',
          content: userInput,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setUserInput('');
    }
  }, [userInput, socket]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-neutral-900 px-4 text-white">
      {socket ? (
        <div className="flex flex-col w-full max-w-2xl h-[600px] bg-zinc-950 border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
 
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-zinc-900">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-amber-400" />
              <h3 className="text-lg font-mono font-semibold text-zinc-100">
                Real-time Chat
              </h3>
            </div>
            <p className="text-sm text-zinc-400">WebSocket Demo</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-zinc-800">
            {messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.source === 'client' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-lg text-sm break-words font-mono shadow ${
                      msg.source === 'client'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-neutral-200 text-black rounded-bl-none'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div className="text-xs mt-1 text-right opacity-60">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-400 text-center mt-4">
                No messages yet.
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="relative w-full p-4 bg-zinc-900 border-t border-neutral-800 flex items-center gap-2">
            <button
              className={`text-white hover:text-amber-400 transition ${
                emoji ? 'text-amber-400' : ''
              }`}
              title="Emojis"
              onClick={() => setEmoji((prev) => !prev)}
            >
              <SmileIcon className="w-6 h-6" />
            </button>

            {emoji && (
              <div ref={emojiRef} className="absolute bottom-16 left-4 z-10">
                <EmojiPicker
                  theme={Theme.DARK}
                  emojiStyle={EmojiStyle.APPLE}
                  suggestedEmojisMode={SuggestionMode.RECENT}
                  onEmojiClick={(emojiData) => {
                    setUserInput((prev) => prev + emojiData.emoji);
                  }}
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2 rounded-md bg-zinc-700 placeholder-zinc-400 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <button
              onClick={handleSend}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 transition text-black font-semibold rounded-md"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-[400px] bg-black rounded-md shadow text-zinc-100 font-mono text-2xl">
          Connecting to WebSocket...
        </div>
      )}
    </div>
  );
}

export default App;
