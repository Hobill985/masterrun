'use client';
import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// 金色硬币SVG组件，支持正反面
const CoinSVG = ({ side, flipping, duration }: { side: 0 | 1, flipping: boolean, duration: number }) => (
  <div className="w-24 h-24 flex items-center justify-center coin3d">
    <div className={`w-full h-full coin-inner${flipping ? ' flipping' : ''}`} style={{ transition: `transform ${duration}ms cubic-bezier(.4,2,.6,1)` }}> 
      {side === 1 ? (
        <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
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
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="64" fontWeight="bold" fill="#bfa140" style={{filter:'drop-shadow(0 2px 2px #fffbe6)'}}>5</text>
        </svg>
      ) : (
        <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
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
          <polygon points="60,35 68,58 93,58 72,72 80,95 60,80 40,95 48,72 27,58 52,58" fill="#fffbe6" stroke="#ffd700" strokeWidth="3" style={{filter:'drop-shadow(0 2px 2px #ffd700)'}} />
        </svg>
      )}
    </div>
  </div>
);

const COIN_NUM = 3;
const TOSS_TOTAL = 6;

const AI_SYSTEM_PROMPT =
  '你是一位精通六爻预测的国学大师，兼通人生哲理与西方决策科学。你的风格专业、简明，偶尔点到为止地风趣幽默，但绝不话痨。你的主要任务是根据用户的首次抛硬币时间、地区和六次抛硬币（正/反）结果，结合六爻原理，为用户推理卦象，给出专业分析、结论和建议，帮助用户决策。请用通俗易懂、简明有力的语言与用户交流。\n【补充说明】摇卦是采用3枚2012年的中国5角硬币进行的，摇卦记录的结果是代表每次出现图案一面的硬币个数。\n【输出结构】请将分析内容分为以下六个部分：1.卦象解析（本卦、变卦、时间背景）；2.关键爻像分析；3.应期判断；4.具体建议；5.决策科学（结合决策科学、心理学、职业生涯、管理学、历史学等综合学科）；6.总结（用一句幽默或发人深省的话）。\n【输出格式要求】每一部分的标题请用"**【标题】**"的Markdown格式（如：**【卦象解析】**）。每一部分内容后请空一行，确保分隔清晰。内容可用有序列表、分段等方式，确保结构清晰、易于阅读。最后，请用一句话主动询问用户的想法或是否有进一步的问题，以促进互动。';
const AI_FREE_PROMPT = '你是一位风趣、专业、善于启发思考的国学大师，可以和用户自由交流六爻、人生、决策等话题。请像真人一样自然、口语化地与用户对话，无需结构化格式，针对用户的问题给出真诚、贴近生活的建议或看法。';

const WELCOME_MSG = '小友，你好！现在可以告诉我具体想咨询哪方面的问题？比如事业、感情、投资或其他？问题可以具体一些。';

const Home = () => {
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  // 记录每次抛硬币3枚的结果（每次为[0|1,0|1,0|1]）
  const [coinResults, setCoinResults] = useState<number[][]>([]);
  const [firstTossTime, setFirstTossTime] = useState<string | null>(null);
  // 动画相关：每枚硬币的当前面、目标面、翻转角度
  const [coinSides, setCoinSides] = useState<(0|1)[]>(Array(COIN_NUM).fill(1));
  const [flipping, setFlipping] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDuration, setFlipDuration] = useState(2000);
  const [messages, setMessages] = useState<{ text: string, sender: string }[]>([{ text: WELCOME_MSG, sender: 'AI' }]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const animRef = useRef<number | null>(null);
  const [dummy, setDummy] = useState(0); // 强制刷新用
  const angleRefs = useRef<number[]>(Array(COIN_NUM).fill(0));
  const chatRef = useRef<HTMLDivElement>(null);
  const [pendingLocation, setPendingLocation] = useState(false); // 新增：等待用户输入地区
  const [freeChatCount, setFreeChatCount] = useState(0); // 新增：自由对话轮次

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

  // 最简单的抛硬币动画方案（动画时长2-4秒随机，动画结束立即切换结果）
  const tossCoin = () => {
    if (isFlipping || coinResults.length >= TOSS_TOTAL) return;
    setIsFlipping(true);
    const duration = Math.floor(2000 + Math.random() * 2000);
    setFlipDuration(duration);
    setFlipping(true);
    const results: (0|1)[] = Array(COIN_NUM).fill(0).map(() => (Math.random() < 0.5 ? 1 : 0));
    setTimeout(() => {
      setCoinSides(results);
      setFlipping(false);
      setCoinResults(r => [...r, results]);
      if (coinResults.length === 0) {
        setFirstTossTime(new Date().toLocaleTimeString());
      }
      setIsFlipping(false);
    }, duration);
  };

  // 统计每次图案（五角星）数量
  const countStar = (arr: number[]) => arr.filter(x => x === 0).length;

  // 聊天内容自动滚动到底部
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 聊天发送逻辑：首次分析后进入自由对话，最多10轮
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    // 如果等待用户输入地区
    if (pendingLocation) {
      setMessages([...messages, { text: inputMessage, sender: 'user' }]);
      setPendingLocation(false);
      setLoading(true);
      // 用户回复地区后，正式分析
      const guaInfo = `地区：${inputMessage}\n时间：${firstTossTime || '未知'}\n摇卦结果：${coinResults.map(arr => countStar(arr)).join('，')}`;
      const userContent = `我的问题：${messages[messages.length-2]?.text || ''}\n卦象信息：${guaInfo}`;
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
            ...messages.slice(1,-1).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
          ]
        })
      });
      const data = await response.json();
      setMessages(msgs => [...msgs, { text: data.reply, sender: 'AI' }]);
      setFreeChatCount(1); // 进入自由对话第一轮
      setLoading(false);
      return;
    }
    // 正常流程
    const newMessages = [...messages, { text: inputMessage, sender: 'user' }];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);
    // 如果没有地区，AI先问地区
    if (!location) {
      setPendingLocation(true);
      setMessages(msgs => [...msgs, { text: '请告诉我你现在的城市或地区，我才能为你更准确地分析。', sender: 'AI' }]);
      setLoading(false);
      return;
    }
    // 首次分析
    if (freeChatCount === 0) {
      const guaInfo = `地区：${location}\n时间：${firstTossTime || '未知'}\n摇卦结果：${coinResults.map(arr => countStar(arr)).join('，')}`;
      const userContent = messages.length === 1
        ? `我的问题：${inputMessage}\n卦象信息：${guaInfo}`
        : inputMessage;
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: userContent },
            ...messages.slice(1).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
          ]
        })
      });
      const data = await response.json();
      setMessages([...newMessages, { text: data.reply, sender: 'AI' }]);
      setFreeChatCount(1);
      setLoading(false);
      return;
    }
    // 自由对话，最多10轮
    if (freeChatCount >= 10) {
      setMessages(msgs => [...msgs, { text: '本轮自由对话已达10次，如需继续请重新提问或刷新页面。', sender: 'AI' }]);
      setLoading(false);
      return;
    }
    // 自由对话请求
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: AI_FREE_PROMPT },
          ...messages.slice(1).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          { role: 'user', content: inputMessage }
        ]
      })
    });
    const data = await response.json();
    setMessages([...newMessages, { text: data.reply, sender: 'AI' }]);
    setFreeChatCount(c => c + 1);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f7]">
      <div className="w-full max-w-md bg-white/80 rounded-3xl shadow-xl p-8 mt-16 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight" style={{letterSpacing: '-0.03em'}}>大师快跑</h1>
        <div className="text-gray-500 mb-6 text-center">
          <div>当前地区：<span className="font-semibold text-gray-700">{location || '获取中...'}</span></div>
          <div>当前时间：<span className="font-semibold text-gray-700">{time}</span></div>
        </div>
        {/* 3枚硬币动画展示 */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex gap-4 mb-2">
            {Array(COIN_NUM).fill(0).map((_, i) => (
              <CoinSVG key={i} side={coinSides[i]} flipping={flipping} duration={flipDuration} />
            ))}
          </div>
          <button
            className="mt-2 px-8 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-lg rounded-full shadow-md hover:shadow-lg transition-all font-semibold disabled:opacity-50"
            onClick={tossCoin}
            disabled={isFlipping || coinResults.length >= TOSS_TOTAL}
          >
            {coinResults.length < TOSS_TOTAL ? '抛硬币' : '已完成'}
          </button>
        </div>
        <div className="w-full text-center text-gray-600 mb-2">
          <div>首次抛硬币时间：<span className="font-semibold">{firstTossTime || '未开始'}</span></div>
          <div>每次图案出现数量：<span className="font-semibold">{coinResults.length ? coinResults.map(arr => countStar(arr)).join('，') : '暂无'}</span></div>
        </div>
        {/* 问题推理界面 */}
        {coinResults.length === 6 && (
          <div className="w-full mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">问题推理</h2>
            <div ref={chatRef} className="bg-gray-100 rounded-xl p-4 h-96 overflow-y-auto mb-2 flex flex-col gap-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-base ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    {msg.sender === 'AI' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-yellow-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    <span className="text-gray-500">大师思考中…</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                className="flex-1 p-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-gray-900 placeholder-gray-400"
                placeholder="输入消息..."
              />
              <button
                className="px-5 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={handleSendMessage}
                disabled={loading}
              >发送</button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .coin3d {
          perspective: 600px;
        }
        .coin-inner {
          transform: rotateX(0deg);
        }
        .coin-inner.flipping {
          transform: rotateX(720deg);
        }
      `}</style>
    </div>
  );
};

export default Home;
