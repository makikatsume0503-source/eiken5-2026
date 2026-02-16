
import { useState, useEffect } from 'react';
import {
  Book, // Edit3, MessageCircle, ArrowLeft, 
  CheckCircle, XCircle,
  Trophy, Star, Heart, Keyboard, // Delete, 
  Smile, HelpCircle,
  Zap, Calendar as CalendarIcon, Award, // ChevronLeft, ChevronRight,
  // Sparkles, Target, 
  History, // Volume2, 
  LogOut, LayoutGrid, RotateCcw, Circle, Disc, // AlertCircle
} from 'lucide-react';
import { allQuizData } from './data/quizData';
import type { Question, QuizData } from './data/quizData';
import MenuBtn from './components/MenuBtn';
import CalendarView from './components/CalendarView';
import RabbitMascot from './components/RabbitMascot';

const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

// 保存データ
export interface DailyStats {
  answered: number;
  correct: number;
  categories: string[];
}

interface Stats {
  totalAnswered: number;
  totalCorrect: number;
  // categoriesPlayed: string[]; 
  // hasPerfected: boolean; 
  activityLog: Record<string, DailyStats>;
  reviewList: string[];
  weakTags: Record<string, number>; // tag -> incorrect count
}

export default function App() {
  const [mode, setMode] = useState<'menu' | 'quiz' | 'result' | 'calendar'>('menu');
  const [category, setCategory] = useState<keyof QuizData | 'review' | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mood, setMood] = useState<'normal' | 'happy' | 'sad'>('normal');
  const [userInput, setUserInput] = useState('');

  // ならべかえ用
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // 保存データ
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem('eiken5_training_v9');
    if (!saved) {
      return {
        totalAnswered: 0,
        totalCorrect: 0,
        activityLog: {},
        reviewList: [],
        weakTags: {}
      };
    }
    const parsed = JSON.parse(saved);
    // Migration check: if activityLog values are boolean
    const migratedLog: Record<string, DailyStats> = {};
    if (parsed.activityLog) {
      Object.entries(parsed.activityLog).forEach(([date, val]) => {
        if (typeof val === 'boolean') {
          migratedLog[date] = { answered: val ? 30 : 0, correct: val ? 30 : 0, categories: [] };
        } else {
          migratedLog[date] = val as DailyStats;
        }
      });
    }
    return { ...parsed, activityLog: migratedLog, weakTags: parsed.weakTags || {} };
  });

  useEffect(() => {
    localStorage.setItem('eiken5_training_v9', JSON.stringify(stats));
  }, [stats]);

  // スタンプ判定 (きょう)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStats = stats.activityLog[todayStr] || { answered: 0, correct: 0, categories: [] };

  const earnedStamps = [
    { label: 'やったよ', icon: <Circle size={24} />, achieved: todayStats.answered >= 1, color: 'text-green-500', bg: 'bg-green-100' },
    { label: '30もん', icon: <Disc size={24} />, achieved: todayStats.answered >= 30, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: '3しゅるい', icon: <Heart size={24} />, achieved: todayStats.categories.length >= 3, color: 'text-pink-500', bg: 'bg-pink-100' },
  ];

  const playAudio = (text: string) => {
    // ...
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const startQuiz = (cat: keyof QuizData | 'review') => {
    setCategory(cat);
    let shuffled: Question[];
    if (cat === 'review') {
      if (stats.reviewList.length === 0) return;
      const flatData = Object.values(allQuizData).flat();
      shuffled = shuffle(stats.reviewList.map(id => flatData.find(q => q.id === id)).filter((q): q is Question => !!q));

      // スマート復習: 苦手なタグを含む問題を優先
      shuffled.sort((a, b) => {
        const aWeak = a.tags?.reduce((sum, tag) => sum + (stats.weakTags[tag] || 0), 0) || 0;
        const bWeak = b.tags?.reduce((sum, tag) => sum + (stats.weakTags[tag] || 0), 0) || 0;
        return bWeak - aWeak; // 苦手スコアが高い順
      });

      // Fallback if reviewList has IDs not in data?
      if (shuffled.length === 0) return;
    } else {
      shuffled = shuffle(allQuizData[cat]);
    }

    const picked = shuffled.slice(0, 30);
    setCurrentQuestions(picked);
    setCurrentIndex(0);
    setScore(0);
    setMode('quiz');
    setMood('normal');
    setUserInput('');
    initQuestionState(picked[0]);
  };

  const initQuestionState = (q: Question) => {
    if (q && q.words) {
      setAvailableWords(shuffle(q.words));
      setSelectedWords([]);
    }
  };

  const handleWordClick = (word: string, index: number) => {
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const resetReorder = () => {
    initQuestionState(currentQuestions[currentIndex]);
  };

  const processAnswer = (correct: boolean) => {
    const currentQ = currentQuestions[currentIndex];
    setIsCorrect(correct);
    setShowFeedback(true);

    const speakText = currentQ.e || currentQ.q?.replace('( )', currentQ.a && typeof currentQ.correct === 'number' ? currentQ.a[currentQ.correct] : '');

    // 即時保存 (Update Stats Immediately)
    const today = new Date().toISOString().split('T')[0];

    setStats(prev => {
      const currentDaily = prev.activityLog[today] || { answered: 0, correct: 0, categories: [] };
      const newCategories = (category && category !== 'review' && !currentDaily.categories.includes(category))
        ? [...currentDaily.categories, category]
        : currentDaily.categories;

      // Update weakTags
      const currentWeakTags = { ...prev.weakTags };
      if (!correct && currentQ.tags) {
        currentQ.tags.forEach(tag => {
          currentWeakTags[tag] = (currentWeakTags[tag] || 0) + 1;
        });
      }

      return {
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        activityLog: {
          ...prev.activityLog,
          [today]: {
            answered: currentDaily.answered + 1,
            correct: currentDaily.correct + (correct ? 1 : 0),
            categories: newCategories
          }
        },
        reviewList: correct
          ? (category === 'review' ? prev.reviewList.filter(id => id !== currentQ.id) : prev.reviewList)
          : (!prev.reviewList.includes(currentQ.id) ? [...prev.reviewList, currentQ.id] : prev.reviewList),
        weakTags: currentWeakTags
      };
    });

    if (correct) {
      setScore(s => s + 1);
      setMood('happy');
    } else {
      setMood('sad');
    }

    if (speakText) playAudio(speakText);

    setTimeout(() => {
      setShowFeedback(false);
      setMood('normal');
      setUserInput('');
      if (currentIndex + 1 < currentQuestions.length) {
        const nextQ = currentQuestions[currentIndex + 1];
        setCurrentIndex(currentIndex + 1);
        initQuestionState(nextQ);
      } else {
        setMode('result');
      }
    }, 4000);
  };

  const currentQ = currentQuestions[currentIndex];

  // スマートアドバイス生成
  const getSmartAdvice = () => {
    const weakTags = stats.weakTags;
    // エラーチェック: weakTagsがない場合はデフォルトメッセージ
    if (!weakTags) return "きょうも 3つのスタンプ あつめよう！";

    const entries = Object.entries(weakTags);
    if (entries.length === 0) return "きょうも 3つのスタンプ あつめよう！";

    // 一番間違えているタグを探す
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const [worstTag, count] = sorted[0];

    if (count < 3) return "きょうも 3つのスタンプ あつめよう！";

    // タグごとのメッセージ (ポジティブに！)
    const messages: Record<string, string> = {
      'animal': 'どうぶつ博士(はかせ) に なろう！',
      'food': 'たべものマスター をめざそう！',
      'number': 'すうじ に チャレンジ！',
      'color': 'いろ を 英語(えいご)で いえるかな？',
      'school': 'がっこうの タンゴを おぼえよう！',
      'grammar': 'ぶんぽう が わかると かっこいい！',
      'be-verb': 'beどうし を マスターしよう！',
      'can-verb': '「できる(can)」を つかってみよう！',
      'who': '「だれ(Who)」か わかるかな？',
      'where': '「どこ(Where)」か きいてみよう！',
      'when': '「いつ(When)」か わかるかな？',
      'what': '「なに(What)」か こたえられる？',
      'greeting': 'げんきに あいさつ してみよう！',
      'reorder': 'ならべかえ を とくい にしよう！',
    };

    return messages[worstTag] || `「${worstTag}」に チャレンジ！`;
  };

  return (
    <div className="min-h-screen bg-[#FFF5F8] font-sans text-gray-800 p-4 flex flex-col items-center select-none overflow-x-hidden">

      <header className="w-full max-w-md flex justify-between items-center mb-4">
        <h1 className="text-xl font-black text-pink-500 flex items-center gap-1">
          <Heart className="fill-pink-400 text-pink-400" size={20} />
          英検5級トレーニング
        </h1>
        {mode !== 'menu' && (
          <button
            onClick={() => setMode('menu')}
            className="p-2 rounded-full bg-white text-pink-400 shadow-sm border border-pink-100 active:scale-90 transition-transform flex items-center gap-1 px-3"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-black">もどる</span>
          </button>
        )}
      </header>

      <main className="w-full max-w-md bg-white rounded-[45px] shadow-2xl overflow-hidden border-4 border-pink-200 min-h-[620px] flex flex-col relative transition-all">

        {mode === 'menu' && (
          <div className="p-7 overflow-y-auto w-full">
            <div className="flex justify-between items-start mb-2">
              <RabbitMascot mood="normal" message={getSmartAdvice()} />
              <button onClick={() => setMode('calendar')} className="bg-pink-50 text-pink-500 p-4 rounded-[25px] border-2 border-pink-100 flex flex-col items-center active:scale-95 shadow-sm transition-all">
                <CalendarIcon size={28} />
                <span className="text-[10px] font-black mt-1">きろく</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <MenuBtn title="たんご" sub="Words" icon={<Book />} color="bg-pink-400" onClick={() => startQuiz('vocab')} />
              <MenuBtn title="ならべかえ" sub="Reorder" icon={<LayoutGrid />} color="bg-indigo-400" onClick={() => startQuiz('reorder')} />
              <MenuBtn title="スペル" sub="Spelling" icon={<Keyboard />} color="bg-orange-400" onClick={() => startQuiz('spelling')} />
              <MenuBtn title="あいさつ" sub="Dialogue" icon={<Smile />} color="bg-green-400" onClick={() => startQuiz('dialogue')} />
              <MenuBtn title="ぎもんし" sub="Questions" icon={<HelpCircle />} color="bg-blue-400" onClick={() => startQuiz('questions')} />
              <MenuBtn title="ぶんぽう" sub="Grammar" icon={<Zap />} color="bg-purple-400" onClick={() => startQuiz('grammar')} />
              <div className="col-span-2 mt-2">
                <MenuBtn
                  title="にがてを こくふくする" sub="Review" icon={<History />} color="bg-red-400"
                  onClick={() => startQuiz('review')} badgeCount={stats.reviewList.length}
                />
              </div>
            </div>

            <div className="mt-8 p-5 bg-gradient-to-br from-pink-50 to-white rounded-[35px] border-2 border-pink-100 shadow-inner text-center">
              <p className="text-[10px] text-pink-400 font-black flex items-center gap-1 justify-center mb-2"><Award size={14} /> きょうのスタンプ</p>
              <div className="flex justify-around items-center gap-2">
                {earnedStamps.map((stamp, i) => (
                  <div key={i} className={`flex flex-col items-center transition-all duration-700 ${stamp.achieved ? 'scale-110' : 'opacity-40 grayscale'}`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stamp.achieved ? `${stamp.bg} ${stamp.color} shadow-lg ring-2 ring-white` : 'bg-gray-100 text-gray-400'}`}>
                      {stamp.icon}
                    </div>
                    <span className="text-[10px] font-black mt-1 text-gray-500">{stamp.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'calendar' && (
          <div className="p-8 flex flex-col h-full w-full">
            <h2 className="text-2xl font-black text-pink-500 mb-6 flex items-center gap-3 justify-center">
              <div className="bg-pink-500 p-2 rounded-2xl text-white shadow-md"><CalendarIcon /></div>
              がんばりきろく
            </h2>
            <CalendarView activityLog={stats.activityLog} />
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-5 bg-blue-50 rounded-[30px] border-2 border-blue-100 text-center">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Answered</p>
                <p className="text-3xl font-black text-blue-600 leading-none">{stats.totalAnswered}<span className="text-xs ml-1">もん</span></p>
              </div>
              <div className="p-5 bg-pink-50 rounded-[30px] border-2 border-pink-100 text-center">
                <p className="text-[10px] text-pink-400 font-black uppercase mb-1">Correct</p>
                <p className="text-3xl font-black text-pink-600 leading-none">{stats.totalCorrect}<span className="text-xs ml-1">てん</span></p>
              </div>
            </div>
            <button onClick={() => setMode('menu')} className="w-full mt-auto py-5 bg-pink-500 text-white rounded-[25px] font-black text-xl shadow-lg active:scale-95 transition-all">もどる</button>
          </div>
        )}

        {mode === 'quiz' && currentQ && (
          <div className="p-7 flex-1 flex flex-col relative w-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="bg-pink-100 text-pink-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-sm">
                Q {currentIndex + 1} / {currentQuestions.length}
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-100">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black text-yellow-600">{score}</span>
              </div>
            </div>

            <RabbitMascot
              mood={mood}
              message={category === 'review' ? "にがてを こくふくしよう！" : `${currentIndex + 1}もんめ！`}
              onSpeak={() => playAudio(currentQ.e || currentQ.q?.replace('( )', 'blank') || '')}
            />

            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-pink-50/40 p-6 rounded-[35px] mb-6 text-center border-2 border-pink-50 min-h-[120px] flex flex-col items-center justify-center shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-100/50">
                  <div className="h-full bg-pink-400 transition-all duration-300" style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}></div>
                </div>
                <h2 className="text-lg font-black text-gray-700 whitespace-pre-wrap leading-tight">
                  {currentQ.j ? currentQ.j : currentQ.q}
                </h2>
                {currentQ.words && (
                  <div className="mt-4 p-3 bg-white/80 w-full rounded-2xl border-2 border-dashed border-pink-200 min-h-[50px] flex flex-wrap gap-2 justify-center items-center">
                    {selectedWords.map((w, i) => (
                      <span key={i} className={`text-xl font-black ${['.', '?'].includes(w) ? 'text-indigo-400' : 'text-pink-500'}`}>{w}</span>
                    ))}
                  </div>
                )}
              </div>

              {currentQ.words ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableWords.map((word, idx) => (
                      <button
                        key={idx}
                        onClick={() => !showFeedback && handleWordClick(word, idx)}
                        className={`px-4 py-3 bg-white border-2 rounded-2xl font-black shadow-sm active:scale-95 transition-all 
                          ${['.', '?'].includes(word) ? 'border-indigo-200 text-indigo-400 text-xl' : 'border-indigo-100 text-indigo-600'}`}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetReorder} className="p-4 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 active:scale-90 transition-all"><RotateCcw size={24} /></button>
                    <button
                      disabled={availableWords.length > 0 || showFeedback}
                      onClick={() => {
                        const joined = selectedWords.join(' ').replace(/\s([?.])/g, '$1');
                        processAnswer(joined === currentQ.e);
                      }}
                      className="flex-1 p-5 bg-indigo-500 text-white rounded-3xl font-black text-xl shadow-lg border-b-8 border-indigo-700 active:border-b-0 active:translate-y-2 disabled:opacity-30 transition-all"
                    >
                      できた！
                    </button>
                  </div>
                </div>
              ) : currentQ.j && !currentQ.a ? (
                <form onSubmit={(e) => { e.preventDefault(); if (userInput && currentQ.e) processAnswer(userInput.toLowerCase().trim() === currentQ.e.toLowerCase()); }} className="space-y-4">
                  <input type="text" autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value.toLowerCase())} placeholder="ABC..." className="w-full p-5 text-center text-4xl font-mono border-4 border-pink-100 rounded-[30px] focus:border-pink-300 outline-none text-pink-600 shadow-sm" />
                  <button type="submit" disabled={!userInput} className="w-full p-5 bg-pink-500 text-white rounded-[30px] font-black text-2xl shadow-lg border-b-8 border-pink-700 active:border-b-0 active:translate-y-2 transition-all">できた！</button>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {currentQ.a?.map((choice, idx) => (
                    <button key={idx} onClick={() => !showFeedback && processAnswer(idx === currentQ.correct)} className={`p-4 rounded-[25px] text-left font-black border-2 transition-all ${showFeedback && idx === currentQ.correct ? 'bg-green-100 border-green-500 text-green-700 scale-[1.03]' : 'bg-white border-pink-50 hover:bg-pink-50 text-gray-600'}`}>
                      <span className="inline-block w-7 h-7 bg-pink-100 text-pink-500 rounded-full text-center text-sm mr-3 leading-7 shadow-sm">{idx + 1}</span>
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showFeedback && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center backdrop-blur-md z-30 text-center p-6 overflow-y-auto">
                <div className="animate-bounce mb-6 shrink-0">
                  {isCorrect ? <CheckCircle size={100} className="text-green-500 drop-shadow-lg" /> : <XCircle size={100} className="text-red-400 drop-shadow-lg" />}
                </div>

                <div className="bg-white p-6 rounded-[40px] shadow-2xl border-4 border-pink-100 w-full max-w-xs animate-in slide-in-from-bottom-4 duration-300">
                  <div className="mb-3">
                    <p className="text-gray-400 font-bold mb-1 text-[10px]">{isCorrect ? "せいかいのはつおん" : "ただしいこたえ"}</p>
                    <p className="text-xl font-black text-pink-500 tracking-tight whitespace-pre-wrap leading-tight">
                      {currentQ.e ? currentQ.e : currentQ.a && typeof currentQ.correct === 'number' ? currentQ.a[currentQ.correct] : ''}
                    </p>
                  </div>

                  {(currentQ.translation || currentQ.j) && (
                    <div className="bg-pink-50 p-3 rounded-2xl mb-3 border border-pink-100">
                      <p className="text-gray-400 text-[10px] font-bold mb-1">日本語のいみ</p>
                      <p className="text-xs font-bold text-gray-600 leading-tight whitespace-pre-wrap">{currentQ.translation || currentQ.j}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-pink-50">
                    <p className="text-pink-600 font-bold text-xs leading-relaxed">{currentQ.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* リザルト */}
        {mode === 'result' && (
          <div className="p-10 text-center flex-1 flex flex-col justify-center items-center w-full">
            <Trophy size={140} className="text-yellow-400 drop-shadow-xl animate-pulse mb-6" />
            <h2 className="text-4xl font-black text-pink-600 mb-2">完走おめでとう！</h2>
            <div className="bg-gradient-to-b from-pink-50 to-white rounded-[50px] p-8 mb-8 border-4 border-pink-100 shadow-xl w-full">
              <div className="text-8xl font-black text-pink-500 leading-none mb-1 tracking-tighter">{score}</div>
              <p className="text-pink-400 font-black text-xl uppercase mb-4 tracking-widest">Total Points</p>
              <div className="flex flex-wrap gap-1 justify-center px-4 mb-4">
                {[...Array(currentQuestions.length)].map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i < score ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                ))}
              </div>
              <p className="text-xs font-bold text-pink-300">{currentQuestions.length}問中 {score}問せいかい！</p>
            </div>
            <button onClick={() => setMode('menu')} className="w-full py-6 bg-pink-500 text-white rounded-[35px] font-black text-2xl shadow-xl border-b-[10px] border-pink-700 active:scale-95 transition-all">メニューへもどる</button>
          </div>
        )}
      </main>

      <footer className="mt-6 text-pink-300 flex flex-col items-center opacity-50"><span className="font-black text-[10px] uppercase tracking-[0.4em]">Eiken Training System</span></footer>
    </div>
  );
}
