"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [captcha, setCaptcha] = useState("");
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(15);
  const [isRunning, setIsRunning] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    queue: 1,
    multiplier: 1.0,
    type: 2040,
    correct: 0,
    wrong: 0,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const length = 4 + Math.floor(Math.random() * 2); // 4-5 chars
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
    setTimer(15); // Reset timer
    return result;
  }, []);

  const drawCaptcha = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#f3f4f6"; // bg-gray-100
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.2)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Text
    ctx.font = "bold 48px Courier New";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    // Draw each char with some rotation/offset
    const startX = 40;
    const spacing = 50;
    
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(startX + i * spacing, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillStyle = `rgb(${Math.random()*100},${Math.random()*100},${Math.random()*100})`;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    
    // More noise lines on top
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

  }, []);

  useEffect(() => {
    const newCaptcha = generateCaptcha();
    drawCaptcha(newCaptcha);
  }, [generateCaptcha, drawCaptcha]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          // Timeout logic
          setMessage("超时! 扣除 0.2 元");
          setBalance((b) => Math.max(0, b - 0.2)); // Deduct money
          const newC = generateCaptcha();
          drawCaptcha(newC);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, generateCaptcha, drawCaptcha]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isRunning) return;

    if (input.toLowerCase() === captcha.toLowerCase()) {
      // Correct
      const earned = 0.1 * stats.multiplier;
      setBalance((b) => b + earned);
      setStats(s => ({ ...s, correct: s.correct + 1 }));
      setMessage(`正确! +${earned.toFixed(2)} 元`);
    } else {
      // Wrong
      setStats(s => ({ ...s, wrong: s.wrong + 1 }));
      setMessage("错误! 请重试");
    }
    
    setInput("");
    const newC = generateCaptcha();
    drawCaptcha(newC);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleWithdraw = () => {
    if (balance < 10) {
      alert("满 10 元才能提现！当前余额不足。");
    } else {
      alert(`成功提现 ${balance.toFixed(2)} 元！(假装到账了)`);
      setBalance(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e0e0] p-4 font-sans text-sm select-none flex items-center justify-center">
      <div className="w-full max-w-4xl bg-[#f0f0f0] border-2 border-gray-400 shadow-lg flex flex-col md:flex-row h-[600px]">
        
        {/* Left Main Area */}
        <div className="flex-1 flex flex-col border-r-2 border-gray-300">
          {/* Captcha Display */}
          <div className="flex-1 bg-white m-2 border-2 border-gray-300 relative flex items-center justify-center overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={320} 
              height={150} 
              className="cursor-crosshair"
            />
            {!isRunning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                已暂停
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="h-48 bg-[#d4f7d4] p-2 border-t-2 border-gray-300 flex flex-col gap-2">
            <div className="bg-[#aaffaa] p-1 text-xs border border-green-600 text-green-900">
              打码区: 请输入对应的4-5位英文字母/数字
            </div>
            
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-12 text-2xl px-2 border-2 border-gray-400 focus:outline-none focus:border-blue-500 font-mono uppercase"
                placeholder="在此输入..."
                autoFocus
                disabled={!isRunning}
              />
              <button 
                onClick={() => handleSubmit()}
                className="h-12 px-6 bg-gray-200 border-2 border-gray-400 active:border-gray-600 active:bg-gray-300 font-bold"
              >
                提交 (空格)
              </button>
              <button className="h-12 px-4 bg-gray-200 border-2 border-gray-400 text-red-600 font-bold">
                报错
              </button>
            </div>

            <div className="mt-2 text-red-600 font-bold text-lg">
              {message || "纯英文: 每码0.1元, 超时扣0.2元。"}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 bg-[#e6f2e6] p-2 flex flex-col gap-2 text-sm">
          <div className="bg-[#d0e8d0] p-2 border border-gray-400">
            <div className="flex justify-between"><span>队列:</span> <span>{stats.queue}</span></div>
            <div className="flex justify-between"><span>倍数:</span> <span>{stats.multiplier}</span></div>
            <div className="flex justify-between"><span>类型:</span> <span>{stats.type}</span></div>
            <div className="flex justify-between font-bold text-red-600"><span>倒计时:</span> <span>{timer}</span></div>
            <div className="mt-2 border-t border-gray-400 pt-1">
              <div className="flex justify-between"><span>正确:</span> <span className="text-green-600">{stats.correct}</span></div>
              <div className="flex justify-between"><span>错误:</span> <span className="text-red-600">{stats.wrong}</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button className="py-1 px-2 bg-gray-200 border border-gray-400 text-xs">查询</button>
            <button className="py-1 px-2 bg-gray-200 border border-gray-400 text-xs text-red-600">查询排名</button>
            <button className="py-1 px-2 bg-gray-200 border border-gray-400 text-xs">打码设置选项</button>
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`py-2 px-2 border border-gray-400 font-bold ${isRunning ? 'bg-green-400 hover:bg-green-500' : 'bg-red-400 hover:bg-red-500'}`}
            >
              {isRunning ? "停止打码" : "开始打码"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-gray-700 mt-2 border border-gray-300 bg-white p-1">
            <p className="font-bold mb-1">公告:</p>
            <p>1. 如需休息，请先点击停止按钮。</p>
            <p>2. 各种类型的码，得分不一样。</p>
            <p>3. 夜班奖励措施，点击查看。</p>
            <p className="mt-2 font-bold">加分时段:</p>
            <p>0:00--2:00 1.1倍</p>
            <p>2:00--5:00 1.2倍</p>
            <p>6:00--8:00 1.1倍</p>
            <p className="mt-2 font-bold">验证码类型积分对照表</p>
            <p>4位数字+英文 0.1元</p>
            <p>5位数字+英文 0.12元</p>
            <p>以后每增加一位增加0.02元</p>
          </div>
          
          <div className="mt-auto bg-yellow-100 p-2 border border-yellow-300">
            <div className="text-lg font-bold text-blue-800">余额: {balance.toFixed(2)} 元</div>
            <button 
              onClick={handleWithdraw}
              className="w-full mt-1 bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700"
            >
              提现
            </button>
          </div>
        </div>

      </div>
      <div className="fixed bottom-2 text-center w-full text-gray-500 text-xs pointer-events-none">
        ID: 88483721 | Vercel Pretend Work System v1.0
      </div>
    </div>
  );
}
