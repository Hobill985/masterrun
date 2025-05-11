'use client';
import { useEffect, useState } from 'react';

// 金色硬币SVG组件，背面为五角星
const CoinSVG = ({ side, flipping }: { side: 0 | 1, flipping: boolean }) => (
  <div className="w-32 h-32 flex items-center justify-center">
    <svg
      className={`transition-transform duration-[2000ms] ${flipping ? 'animate-flip' : ''}`}
      style={{ transform: flipping ? 'rotateX(720deg)' : 'rotateX(0deg)' }}
      width="120" height="120" viewBox="0 0 120 120" fill="none"
    >
      {/* 金色边框和渐变 */}
      <defs>
        <radialGradient id="gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="60%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#bfa140" />
        </radialGradient>
        <radialGradient id="shine" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#gold)" stroke="#bfa140" strokeWidth="8" />
      <circle cx="60" cy="60" r="48" fill="url(#shine)" />
      {side === 1 ? (
        // 正面：数字5
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="64" fontWeight="bold" fill="#bfa140" style={{filter:'drop-shadow(0 2px 2px #fffbe6)'}}>5</text>
      ) : (
        // 背面：五角星
        <polygon
          points="60,35 68,58 93,58 72,72 80,95 60,80 40,95 48,72 27,58 52,58"
          fill="#fffbe6"
          stroke="#ffd700"
          strokeWidth="3"
          style={{filter:'drop-shadow(0 2px 2px #ffd700)'}}
        />
      )}
    </svg>
  </div>
);

const Home = () => {
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [coinResults, setCoinResults] = useState<number[]>([]);
  const [firstTossTime, setFirstTossTime] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flippingSide, setFlippingSide] = useState<0 | 1>(1);
  const [messages, setMessages] = useState<{ text: string, sender: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setLocation(data.city);
      })
      .catch(() => {});
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 抛硬币动画
  const tossCoin = () => {
    if (isFlipping || coinResults.length >= 6) return;
    setIsFlipping(true);
    const result = Math.random() < 0.5 ? 1 : 0;
    setFlippingSide(result);
    if (coinResults.length === 0) {
      setFirstTossTime(new Date().toLocaleTimeString());
    }
    setTimeout(() => {
      setCoinResults([...coinResults, result]);
      setIsFlipping(false);
    }, Math.random() * 2000 + 2000);
  };

  // 聊天
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    setMessages([...messages, { text: inputMessage, sender: 'user' }]);
    setInputMessage('');
    // AI回复
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: inputMessage },
      ] })
    });
    const data = await response.json();
    setMessages([...messages, { text: inputMessage, sender: 'user' }, { text: data.reply, sender: 'AI' }]);
  };

  // 结果转"正/反"
  const resultText = (n: number) => n === 1 ? '正' : '反';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7]">
      <div className="w-full max-w-md bg-white/80 rounded-3xl shadow-xl p-8 mt-16 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight" style={{letterSpacing: '-0.03em'}}>大师快跑</h1>
        <div className="text-gray-500 mb-6 text-center">
          <div>当前地区：<span className="font-semibold text-gray-700">{location || '获取中...'}</span></div>
          <div>当前时间：<span className="font-semibold text-gray-700">{time}</span></div>
        </div>
        <div className="flex flex-col items-center mb-6">
          <CoinSVG side={coinResults.length === 0 ? 1 : flippingSide} flipping={isFlipping} />
          <button
            className="mt-2 px-8 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-lg rounded-full shadow-md hover:shadow-lg transition-all font-semibold disabled:opacity-50"
            onClick={tossCoin}
            disabled={isFlipping || coinResults.length >= 6}
          >
            {coinResults.length < 6 ? '抛硬币' : '已完成'}
          </button>
        </div>
        <div className="w-full text-center text-gray-600 mb-2">
          <div>首次抛硬币时间：<span className="font-semibold">{firstTossTime || '未开始'}</span></div>
          <div>抛硬币结果：<span className="font-semibold">{coinResults.length ? coinResults.map(resultText).join('，') : '暂无'}</span></div>
        </div>
        {/* 问题推理界面 */}
        {coinResults.length === 6 && (
          <div className="w-full mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">问题推理</h2>
            <div className="bg-gray-100 rounded-xl p-4 h-56 overflow-y-auto mb-2 flex flex-col gap-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-base ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                className="flex-1 p-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-gray-900 placeholder-gray-400"
                placeholder="输入消息..."
              />
              <button
                className="px-5 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={handleSendMessage}
              >发送</button>
            </div>
          </div>
        )}
      </div>
      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes flip {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(720deg); }
        }
        .animate-flip {
          animation: flip 2s cubic-bezier(.4,2,.6,1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Home;
