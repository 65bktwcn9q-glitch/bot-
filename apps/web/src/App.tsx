import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiUser, LessonSession, LessonTask, setToken } from './api';

type TabKey = 'training' | 'profile' | 'limits' | 'vip' | 'payments' | 'support';

const uiCopy = {
  ru: {
    headerTitle: 'Deutsch Flow',
    headerSubtitle: 'Telegram Web App для изучения немецкого и английского с DeepSeek AI',
    freeAccess: 'Free доступ',
    adsOn: 'Реклама: вкл.',
    adsOff: 'Реклама: выкл.',
    support: 'Поддержка',
    terms: 'Условия',
    theme: 'Тема',
    headline: 'Учись говорить на языке в формате мини-уроков',
    description:
      'Персональные треки, короткие задания и AI-помощник помогают закреплять грамматику и лексику каждый день.',
    startLesson: 'Начать урок',
    getVip: 'Получить VIP',
    lessonsLimit: 'Уроков/день по лимиту',
    accuracy: 'Точность оценивания речи',
    tracks: 'Персональные треки',
    focusTitle: 'Ваш персональный фокус',
    weeklyProgress: 'Прогресс недели',
    aiTitle: 'DeepSeek AI',
    aiBenefits: ['Оценка заданий за секунды', 'Гибкие сценарии', 'Подсказки и разбор ошибок'],
    assistantTitle: 'AI помощник',
    ask: 'Спросить',
    assistantPlaceholder: 'Сформулируйте вопрос…',
    openBot: 'Открыть бота',
    training: 'Обучение',
    profile: 'Профиль',
    limits: 'Лимиты',
    vip: 'VIP',
    payments: 'Платежи',
    supportTab: 'Поддержка',
    chooseFocus: 'Выберите фокус',
    focusTravel: 'Путешествия',
    focusWork: 'Работа',
    focusExams: 'Экзамены',
    focusCulture: 'Культура',
    lessonComplete: 'Урок завершён',
    correct: 'Верно',
    incorrect: 'Неверно',
    next: 'Следующее',
    finish: 'Завершить',
    uiLanguage: 'Язык интерфейса',
    learningLanguage: 'Язык обучения',
    levelDe: 'Уровень немецкого',
    levelEn: 'Уровень английского',
    streak: 'Серия',
    totalLessons: 'Всего уроков',
    lessonsRemaining: 'Осталось уроков сегодня',
    resetsAt: 'Обновится',
    vipBenefits: 'Преимущества VIP',
    vipPerks: ['Без рекламы', 'Без лимитов', 'Приоритетные ответы AI'],
    plan: 'План',
    buy: 'Купить',
    testPurchase: 'Test purchase',
    history: 'История платежей',
    faq: 'FAQ',
    contact: 'Связаться',
    answerSaved: 'Ответ сохранён',
    emptyChat: 'Пока нет сообщений. Спросите о грамматике или фразах.'
  },
  en: {
    headerTitle: 'Deutsch Flow',
    headerSubtitle: 'Telegram Web App for learning German and English with DeepSeek AI',
    freeAccess: 'Free access',
    adsOn: 'Ads: on',
    adsOff: 'Ads: off',
    support: 'Support',
    terms: 'Terms',
    theme: 'Theme',
    headline: 'Learn to speak through mini-lessons',
    description:
      'Personal tracks, short tasks, and an AI assistant help you practice grammar and vocabulary daily.',
    startLesson: 'Start lesson',
    getVip: 'Get VIP',
    lessonsLimit: 'Lessons/day limit',
    accuracy: 'Speech grading accuracy',
    tracks: 'Personal tracks',
    focusTitle: 'Your personal focus',
    weeklyProgress: 'Weekly progress',
    aiTitle: 'DeepSeek AI',
    aiBenefits: ['Instant grading', 'Flexible scenarios', 'Hints and explanations'],
    assistantTitle: 'AI assistant',
    ask: 'Ask',
    assistantPlaceholder: 'Ask a question…',
    openBot: 'Open bot',
    training: 'Training',
    profile: 'Profile',
    limits: 'Limits',
    vip: 'VIP',
    payments: 'Payments',
    supportTab: 'Support',
    chooseFocus: 'Choose focus',
    focusTravel: 'Travel',
    focusWork: 'Work',
    focusExams: 'Exams',
    focusCulture: 'Culture',
    lessonComplete: 'Lesson completed',
    correct: 'Correct',
    incorrect: 'Incorrect',
    next: 'Next',
    finish: 'Finish',
    uiLanguage: 'UI language',
    learningLanguage: 'Learning language',
    levelDe: 'German level',
    levelEn: 'English level',
    streak: 'Streak',
    totalLessons: 'Total lessons',
    lessonsRemaining: 'Lessons left today',
    resetsAt: 'Resets',
    vipBenefits: 'VIP benefits',
    vipPerks: ['No ads', 'No limits', 'Priority AI responses'],
    plan: 'Plan',
    buy: 'Buy',
    testPurchase: 'Test purchase',
    history: 'Payment history',
    faq: 'FAQ',
    contact: 'Contact',
    answerSaved: 'Answer saved',
    emptyChat: 'No messages yet. Ask about grammar or phrases.'
  },
  de: {
    headerTitle: 'Deutsch Flow',
    headerSubtitle: 'Telegram Web App zum Deutsch- und Englischlernen mit DeepSeek AI',
    freeAccess: 'Free Zugriff',
    adsOn: 'Werbung: an',
    adsOff: 'Werbung: aus',
    support: 'Support',
    terms: 'AGB',
    theme: 'Theme',
    headline: 'Lerne sprechen mit Mini-Lektionen',
    description:
      'Personalisierte Tracks, kurze Aufgaben und ein AI-Assistent helfen dir täglich beim Üben.',
    startLesson: 'Lektion starten',
    getVip: 'VIP holen',
    lessonsLimit: 'Lektionen/Tag Limit',
    accuracy: 'Sprachbewertung Genauigkeit',
    tracks: 'Personalisierte Tracks',
    focusTitle: 'Dein Fokus',
    weeklyProgress: 'Wochenfortschritt',
    aiTitle: 'DeepSeek AI',
    aiBenefits: ['Sofortiges Feedback', 'Flexible Szenarien', 'Hints & Erklärungen'],
    assistantTitle: 'AI Assistent',
    ask: 'Fragen',
    assistantPlaceholder: 'Stelle eine Frage…',
    openBot: 'Bot öffnen',
    training: 'Training',
    profile: 'Profil',
    limits: 'Limits',
    vip: 'VIP',
    payments: 'Zahlungen',
    supportTab: 'Support',
    chooseFocus: 'Fokus wählen',
    focusTravel: 'Reisen',
    focusWork: 'Arbeit',
    focusExams: 'Prüfungen',
    focusCulture: 'Kultur',
    lessonComplete: 'Lektion abgeschlossen',
    correct: 'Richtig',
    incorrect: 'Falsch',
    next: 'Weiter',
    finish: 'Beenden',
    uiLanguage: 'UI Sprache',
    learningLanguage: 'Lernsprache',
    levelDe: 'Deutsch Level',
    levelEn: 'Englisch Level',
    streak: 'Serie',
    totalLessons: 'Lektionen gesamt',
    lessonsRemaining: 'Lektionen heute übrig',
    resetsAt: 'Reset',
    vipBenefits: 'VIP Vorteile',
    vipPerks: ['Keine Werbung', 'Keine Limits', 'Priorisierte AI Antworten'],
    plan: 'Plan',
    buy: 'Kaufen',
    testPurchase: 'Testkauf',
    history: 'Zahlungshistorie',
    faq: 'FAQ',
    contact: 'Kontakt',
    answerSaved: 'Antwort gespeichert',
    emptyChat: 'Noch keine Nachrichten. Frage nach Grammatik oder Phrasen.'
  }
};

const focusOptions = ['travel', 'work', 'exams', 'culture'] as const;
const plans = [
  { id: '1m', label: '1 месяц', price: '499₽' },
  { id: '3m', label: '3 месяца', price: '1299₽' },
  { id: '12m', label: '12 месяцев', price: '3990₽' },
  { id: 'lifetime', label: 'Lifetime', price: '8990₽' }
];

const levels = ['A1', 'A2', 'B1', 'B2'] as const;

type Payment = {
  id: string;
  plan: string;
  status: string;
  amount: number;
  createdAt: string;
};

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

type LessonAnswerResult = {
  correct: boolean;
  task: LessonTask;
};

const getTelegramInitData = () => {
  const tg = (window as typeof window & { Telegram?: any }).Telegram;
  if (tg?.WebApp) {
    return tg.WebApp.initData || '';
  }
  return '';
};

const getTelegramUser = () => {
  const tg = (window as typeof window & { Telegram?: any }).Telegram;
  return tg?.WebApp?.initDataUnsafe?.user || null;
};

const applyTelegramTheme = () => {
  const tg = (window as typeof window & { Telegram?: any }).Telegram;
  const theme = tg?.WebApp?.themeParams;
  if (!theme) return;
  const root = document.documentElement;
  if (theme.text_color) root.style.setProperty('--tg-text-color', theme.text_color);
  if (theme.hint_color) root.style.setProperty('--tg-hint-color', theme.hint_color);
  if (theme.bg_color) root.style.setProperty('--tg-bg-color', theme.bg_color);
  if (theme.button_color) root.style.setProperty('--tg-accent-color', theme.button_color);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('training');
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [focus, setFocus] = useState('travel');
  const [session, setSession] = useState<LessonSession | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<LessonAnswerResult | null>(null);
  const [ads, setAds] = useState<{ id: string; title: string; body: string; cta: string }[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [onboardingLanguage, setOnboardingLanguage] = useState<ApiUser['learningLanguage']>('de');
  const [onboardingLevel, setOnboardingLevel] = useState<ApiUser['levelDe']>('A1');

  const copy = useMemo(() => (user ? uiCopy[user.uiLanguage] : uiCopy.ru), [user]);

  useEffect(() => {
    applyTelegramTheme();
    const init = async () => {
      try {
        const bypass = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
        const devUserId = import.meta.env.VITE_DEV_USER_ID || '100200300';
        const initData = getTelegramInitData();
        const payload = bypass
          ? { devUserId }
          : {
              initData,
              user: getTelegramUser()
            };
        const data = await apiFetch<{ token: string }>('/auth/telegram', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToken(data.token);
        const me = await apiFetch<ApiUser>('/me');
        setUser(me);
        setFocus(me.focus);
        const adsData = await apiFetch<typeof ads>('/ads');
        setAds(adsData);
        const paymentData = await apiFetch<Payment[]>('/payments');
        setPayments(paymentData);
        const chatData = await apiFetch<ChatMessage[]>('/assistant/history');
        setChatHistory(chatData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAuth(false);
      }
    };
    void init();
  }, []);

  const refreshMe = async () => {
    const me = await apiFetch<ApiUser>('/me');
    setUser(me);
  };

  const updateFocus = async (next: string) => {
    setFocus(next);
    await apiFetch('/focus', { method: 'POST', body: JSON.stringify({ focus: next }) });
    await refreshMe();
  };

  const startLesson = async () => {
    setLessonLoading(true);
    setAnswer('');
    setAnswerResult(null);
    try {
      const data = await apiFetch<LessonSession>('/lesson/start', { method: 'POST' });
      setSession(data);
      await refreshMe();
    } finally {
      setLessonLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!session?.task) return;
    setLessonLoading(true);
    try {
      const result = await apiFetch<LessonAnswerResult>('/lesson/answer', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.sessionId,
          taskId: session.task.id,
          answer
        })
      });
      setAnswerResult(result);
    } finally {
      setLessonLoading(false);
    }
  };

  const nextTask = async () => {
    if (!session) return;
    setLessonLoading(true);
    setAnswer('');
    setAnswerResult(null);
    try {
      const data = await apiFetch<LessonSession>('/lesson/nextTask', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      setSession(data);
      if (data.completed) {
        await refreshMe();
      }
    } finally {
      setLessonLoading(false);
    }
  };

  const resetSession = () => {
    setSession(null);
    setAnswer('');
    setAnswerResult(null);
  };

  const askAssistant = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      content: chatInput
    };
    setChatHistory((prev) => [...prev, userMessage].slice(-10));
    setChatInput('');
    try {
      const data = await apiFetch<{ reply: ChatMessage }>('/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage.content })
      });
      setChatHistory((prev) => [...prev, data.reply].slice(-10));
    } finally {
      setChatLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ApiUser>) => {
    if (!user) return;
    await apiFetch('/profile', { method: 'POST', body: JSON.stringify(updates) });
    await refreshMe();
  };

  const finishOnboarding = async () => {
    if (!user) return;
    const levelUpdates =
      onboardingLanguage === 'de' ? { levelDe: onboardingLevel } : { levelEn: onboardingLevel };
    await updateProfile({
      learningLanguage: onboardingLanguage,
      onboarded: true,
      ...levelUpdates
    });
  };

  const makeTestPurchase = async (plan: string) => {
    await apiFetch('/payments/test', { method: 'POST', body: JSON.stringify({ plan }) });
    const paymentData = await apiFetch<Payment[]>('/payments');
    setPayments(paymentData);
    await refreshMe();
  };

  useEffect(() => {
    const tg = (window as typeof window & { Telegram?: any }).Telegram;
    if (!tg?.WebApp) return;
    const mainButton = tg.WebApp.MainButton;
    const backButton = tg.WebApp.BackButton;
    if (activeTab === 'training' && !session) {
      mainButton.setText(copy.startLesson);
      mainButton.show();
      mainButton.onClick(startLesson);
    } else {
      mainButton.hide();
      mainButton.offClick(startLesson);
    }
    if (session) {
      backButton.show();
      backButton.onClick(resetSession);
    } else {
      backButton.hide();
      backButton.offClick(resetSession);
    }
    return () => {
      mainButton.offClick(startLesson);
      backButton.offClick(resetSession);
    };
  }, [activeTab, session, copy.startLesson]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink">Загрузка…</div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink">
        Ошибка авторизации
      </div>
    );
  }

  const bottomTabs: { key: TabKey; label: string }[] = [
    { key: 'training', label: copy.training },
    { key: 'profile', label: copy.profile },
    { key: 'limits', label: copy.limits },
    { key: 'vip', label: copy.vip },
    { key: 'payments', label: copy.payments },
    { key: 'support', label: copy.supportTab }
  ];

  const focusLabels: Record<string, string> = {
    travel: copy.focusTravel,
    work: copy.focusWork,
    exams: copy.focusExams,
    culture: copy.focusCulture
  };

  return (
    <div className="min-h-screen px-6 pb-24 pt-6 text-ink">
      {!user.onboarded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass rounded-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-semibold">Онбординг</h3>
            <p className="text-sm text-muted">Выберите язык обучения и уровень.</p>
            <label className="block text-sm">
              {copy.learningLanguage}
              <select
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                value={onboardingLanguage}
                onChange={(event) =>
                  setOnboardingLanguage(event.target.value as ApiUser['learningLanguage'])
                }
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block text-sm">
              {onboardingLanguage === 'de' ? copy.levelDe : copy.levelEn}
              <select
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                value={onboardingLevel}
                onChange={(event) => setOnboardingLevel(event.target.value as ApiUser['levelDe'])}
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 text-sm"
              onClick={finishOnboarding}
            >
              {copy.startLesson}
            </button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <header className="glass rounded-card p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 flex items-center justify-center text-xl font-semibold">
              DF
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{copy.headerTitle}</h1>
              <p className="text-sm text-muted max-w-lg">{copy.headerSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-4 py-1 rounded-full bg-white/10 text-sm">
                {copy.freeAccess}
              </span>
              <span className="px-4 py-1 rounded-full bg-white/10 text-sm">
                {user.isVip ? copy.adsOff : copy.adsOn}
              </span>
              <select
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-ink"
                value={user.learningLanguage}
                onChange={(event) => updateProfile({ learningLanguage: event.target.value as ApiUser['learningLanguage'] })}
              >
                <option value="de">DE</option>
                <option value="en">EN</option>
              </select>
            </div>
            <button className="px-4 py-2 rounded-full bg-white/10 text-sm">{copy.support}</button>
            <button className="px-4 py-2 rounded-full bg-white/10 text-sm">{copy.terms}</button>
            <button className="px-4 py-2 rounded-full bg-white/10 text-sm">{copy.theme}</button>
          </div>
        </header>

        {activeTab === 'training' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-card p-6 space-y-4">
                <h2 className="text-3xl font-semibold">{copy.headline}</h2>
                <p className="text-muted">{copy.description}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 text-sm font-semibold"
                    onClick={startLesson}
                    disabled={lessonLoading}
                  >
                    {copy.startLesson}
                  </button>
                  <button className="px-6 py-3 rounded-full bg-white/10 text-sm font-semibold">
                    {copy.getVip}
                  </button>
                  <a
                    className="px-6 py-3 rounded-full bg-white/10 text-sm font-semibold"
                    href="https://t.me/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.openBot}
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-soft rounded-card p-4 text-sm">
                    <p className="text-2xl font-semibold">10</p>
                    <p className="text-muted">{copy.lessonsLimit}</p>
                  </div>
                  <div className="glass-soft rounded-card p-4 text-sm">
                    <p className="text-2xl font-semibold">96%</p>
                    <p className="text-muted">{copy.accuracy}</p>
                  </div>
                  <div className="glass-soft rounded-card p-4 text-sm">
                    <p className="text-2xl font-semibold">4</p>
                    <p className="text-muted">{copy.tracks}</p>
                  </div>
                </div>
              </div>

              {session?.task && (
                <div className="glass rounded-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{session.task.prompt}</h3>
                    <span className="text-sm text-muted">{session.task.type}</span>
                  </div>
                  {session.task.options && (
                    <div className="grid gap-2">
                      {session.task.options.map((option) => (
                        <button
                          key={option}
                          className={`px-4 py-2 rounded-xl text-left ${
                            answer === option ? 'bg-white/20' : 'bg-white/5'
                          }`}
                          onClick={() => setAnswer(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {!session.task.options && (
                    <textarea
                      className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm"
                      rows={4}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                    />
                  )}
                  {answerResult && (
                    <div className={`rounded-xl p-3 text-sm ${answerResult.correct ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                      <p className="font-semibold">
                        {answerResult.correct ? copy.correct : copy.incorrect}
                      </p>
                      <p className="text-muted">{answerResult.task.explanation_ui}</p>
                      <p className="text-muted">{answerResult.task.hint}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!answerResult && (
                      <button
                        className="px-5 py-2 rounded-full bg-white/10"
                        onClick={sendAnswer}
                        disabled={lessonLoading || !answer}
                      >
                        {copy.ask}
                      </button>
                    )}
                    {answerResult && (
                      <button
                        className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"
                        onClick={nextTask}
                        disabled={lessonLoading}
                      >
                        {session.completed ? copy.finish : copy.next}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {session?.completed && (
                <div className="glass rounded-card p-6 text-center">
                  <h3 className="text-2xl font-semibold mb-2">{copy.lessonComplete}</h3>
                  <p className="text-muted">{copy.answerSaved}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass rounded-card p-6 space-y-4">
                <h3 className="text-lg font-semibold">{copy.focusTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  {focusOptions.map((option) => (
                    <button
                      key={option}
                      className={`px-4 py-2 rounded-full text-sm ${
                        focus === option ? 'bg-white/20' : 'bg-white/5'
                      }`}
                      onClick={() => updateFocus(option)}
                    >
                      {focusLabels[option]}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-muted mb-2">
                    <span>{copy.weeklyProgress}</span>
                    <span>{user.weekProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"
                      style={{ width: `${user.weekProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass rounded-card p-6 space-y-3">
                <h3 className="text-lg font-semibold">{copy.aiTitle}</h3>
                <ul className="text-sm text-muted space-y-2">
                  {copy.aiBenefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-card p-6 space-y-3">
                <h3 className="text-lg font-semibold">{copy.assistantTitle}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {chatHistory.length === 0 && (
                    <p className="text-sm text-muted">{copy.emptyChat}</p>
                  )}
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-sm rounded-xl p-2 ${
                        msg.role === 'assistant' ? 'bg-white/10' : 'bg-white/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-full bg-white/5 border border-white/10 px-3 py-2 text-sm"
                    placeholder={copy.assistantPlaceholder}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                  />
                  <button
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 text-sm"
                    onClick={askAssistant}
                    disabled={chatLoading}
                  >
                    {copy.ask}
                  </button>
                </div>
              </div>

              {!user.isVip && ads.length > 0 && (
                <div className="glass rounded-card p-5 space-y-2">
                  <p className="text-xs uppercase text-muted">Ad</p>
                  <h4 className="text-lg font-semibold">{ads[0].title}</h4>
                  <p className="text-sm text-muted">{ads[0].body}</p>
                  <button className="px-4 py-2 rounded-full bg-white/10 text-sm">
                    {ads[0].cta}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">{copy.profile}</h3>
              <div className="space-y-3 text-sm">
                <label className="block">
                  {copy.uiLanguage}
                  <select
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                    value={user.uiLanguage}
                    onChange={(event) => updateProfile({ uiLanguage: event.target.value as ApiUser['uiLanguage'] })}
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </label>
                <label className="block">
                  {copy.learningLanguage}
                  <select
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                    value={user.learningLanguage}
                    onChange={(event) => updateProfile({ learningLanguage: event.target.value as ApiUser['learningLanguage'] })}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className="block">
                  {copy.levelDe}
                  <select
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                    value={user.levelDe}
                    onChange={(event) => updateProfile({ levelDe: event.target.value as ApiUser['levelDe'] })}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  {copy.levelEn}
                  <select
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-2"
                    value={user.levelEn}
                    onChange={(event) => updateProfile({ levelEn: event.target.value as ApiUser['levelEn'] })}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="glass rounded-card p-6 space-y-4">
              <h3 className="text-lg font-semibold">{copy.training}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="glass-soft rounded-card p-4">
                  <p className="text-2xl font-semibold">{user.weekProgress}%</p>
                  <p className="text-muted">{copy.streak}</p>
                </div>
                <div className="glass-soft rounded-card p-4">
                  <p className="text-2xl font-semibold">{user.lessonsToday}</p>
                  <p className="text-muted">{copy.totalLessons}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="mt-8 glass rounded-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">{copy.limits}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="glass-soft rounded-card p-4">
                <p className="text-2xl font-semibold">
                  {Math.max(user.lessonsLimit - user.lessonsToday, 0)}
                </p>
                <p className="text-muted">{copy.lessonsRemaining}</p>
              </div>
              <div className="glass-soft rounded-card p-4">
                <p className="text-2xl font-semibold">00:00</p>
                <p className="text-muted">{copy.resetsAt}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vip' && (
          <div className="mt-8 space-y-6">
            <div className="glass rounded-card p-6 space-y-3">
              <h3 className="text-lg font-semibold">{copy.vipBenefits}</h3>
              <ul className="text-sm text-muted space-y-2">
                {copy.vipPerks.map((perk) => (
                  <li key={perk}>• {perk}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="glass rounded-card p-5 space-y-3">
                  <h4 className="text-lg font-semibold">{plan.label}</h4>
                  <p className="text-2xl font-semibold">{plan.price}</p>
                  <button
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 text-sm"
                    onClick={() => makeTestPurchase(plan.id)}
                  >
                    {copy.testPurchase}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="mt-8 glass rounded-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">{copy.history}</h3>
            <div className="space-y-2 text-sm">
              {payments.length === 0 && <p className="text-muted">Нет платежей</p>}
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div>
                    <p className="font-semibold">{payment.plan}</p>
                    <p className="text-muted">{new Date(payment.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-sm">{payment.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="mt-8 glass rounded-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">{copy.faq}</h3>
            <div className="space-y-3 text-sm text-muted">
              <div>
                <p className="font-semibold text-ink">Как работает Deutsch Flow?</p>
                <p>Мы генерируем мини-уроки и подсказки через AI и адаптируем их под ваш уровень.</p>
              </div>
              <div>
                <p className="font-semibold text-ink">Можно ли учиться без Telegram?</p>
                <p>В режиме разработки доступен DEV_AUTH_BYPASS.</p>
              </div>
            </div>
            <a
              className="inline-flex px-4 py-2 rounded-full bg-white/10 text-sm"
              href="https://t.me/support"
              target="_blank"
              rel="noreferrer"
            >
              {copy.contact}
            </a>
          </div>
        )}
      </div>

      <motion.nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 flex gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {bottomTabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === tab.key ? 'bg-white/20' : 'text-muted'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </motion.nav>
    </div>
  );
};

export default App;
