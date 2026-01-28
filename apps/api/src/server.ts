import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import fetch from 'node-fetch';
import { PrismaClient, type User } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === 'true';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

const createApp = () => {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

const authSchema = z.object({
  initData: z.string().optional(),
  user: z.any().optional(),
  devUserId: z.string().optional()
});

const profileSchema = z.object({
  uiLanguage: z.enum(['ru', 'de', 'en']).optional(),
  learningLanguage: z.enum(['de', 'en']).optional(),
  levelDe: z.enum(['A1', 'A2', 'B1', 'B2']).optional(),
  levelEn: z.enum(['A1', 'A2', 'B1', 'B2']).optional(),
  onboarded: z.boolean().optional()
});

const focusSchema = z.object({ focus: z.enum(['travel', 'work', 'exams', 'culture']) });

const lessonAnswerSchema = z.object({
  sessionId: z.string(),
  taskId: z.string(),
  answer: z.string().min(1)
});

const lessonNextSchema = z.object({ sessionId: z.string() });

const assistantAskSchema = z.object({ message: z.string().min(1) });

const paymentTestSchema = z.object({ plan: z.enum(['1m', '3m', '12m', 'lifetime']) });

const getTelegramHashCheckString = (data: Record<string, string>) => {
  return Object.keys(data)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n');
};

const verifyTelegramInitData = (initData: string) => {
  if (!TELEGRAM_BOT_TOKEN) return false;
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  const hash = data.hash;
  if (!hash) return false;
  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const checkString = getTelegramHashCheckString(data);
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  return hmac === hash;
};

const signToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    res.status(401).send('Unauthorized');
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as express.Request & { userId: string }).userId = payload.userId;
    next();
  } catch {
    res.status(401).send('Unauthorized');
  }
};

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests'
});

  app.post('/api/auth/telegram', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { initData, devUserId } = parsed.data;
  let userId = devUserId;
  if (!DEV_AUTH_BYPASS) {
    if (!initData || !verifyTelegramInitData(initData)) {
      res.status(401).send('Invalid initData');
      return;
    }
    const params = new URLSearchParams(initData);
    const user = params.get('user');
    if (!user) {
      res.status(400).send('Missing user');
      return;
    }
    const parsedUser = JSON.parse(user) as { id: number };
    userId = String(parsedUser.id);
  }

  if (!userId) {
    res.status(400).send('Missing user id');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    await prisma.user.create({
      data: {
        id: userId,
        uiLanguage: 'ru',
        learningLanguage: 'de',
        levelDe: 'A1',
        levelEn: 'A1',
        focus: 'travel'
      }
    });
  }
  const token = signToken(userId);
  res.json({ token });
  });

const computeIsVip = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) return false;
  return subscription.expiresAt > new Date();
};

const computeWeekProgress = async (userId: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const count = await prisma.lessonSession.count({
    where: { userId, startedAt: { gte: sevenDaysAgo } }
  });
  return Math.min(100, count * 10);
};

const computeLessonsToday = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.lessonSession.count({ where: { userId, startedAt: { gte: today } } });
};

  app.get('/api/me', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).send('User not found');
    return;
  }
  const [isVip, weekProgress, lessonsToday] = await Promise.all([
    computeIsVip(userId),
    computeWeekProgress(userId),
    computeLessonsToday(userId)
  ]);
  res.json({
    id: user.id,
    uiLanguage: user.uiLanguage,
    learningLanguage: user.learningLanguage,
    levelDe: user.levelDe,
    levelEn: user.levelEn,
    focus: user.focus,
    onboarded: user.onboarded,
    isVip,
    lessonsToday,
    lessonsLimit: 10,
    weekProgress
  });
  });

  app.post('/api/profile', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data
  });
  res.json({ success: true, user });
  });

  app.post('/api/focus', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = focusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await prisma.user.update({ where: { id: userId }, data: { focus: parsed.data.focus } });
  res.json({ success: true });
  });

const taskSchema = z.object({
  id: z.string(),
  learningLanguage: z.enum(['de', 'en']),
  type: z.enum(['multiple_choice', 'fill_blank', 'short_translation', 'mini_dialog']),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.string(),
  explanation_learn_lang: z.string(),
  explanation_ui: z.string(),
  hint: z.string(),
  tags: z.array(z.string())
});

type TaskInput = z.infer<typeof taskSchema>;

const localTaskTemplates: Record<string, TaskInput[]> = {
  de: [
    {
      id: crypto.randomUUID(),
      learningLanguage: 'de',
      type: 'multiple_choice',
      prompt: 'Выберите правильный перевод: «Я бронирую номер в отеле.»',
      options: ['Ich buche ein Zimmer im Hotel.', 'Ich mache Kaffee.', 'Ich nehme den Zug.'],
      answer: 'Ich buche ein Zimmer im Hotel.',
      explanation_learn_lang: 'Richtig: "Ich buche ein Zimmer im Hotel."',
      explanation_ui: 'Используется глагол buchen + ein Zimmer.',
      hint: 'Глагол buchen = бронировать.',
      tags: ['travel', 'hotel']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'de',
      type: 'fill_blank',
      prompt: 'Заполните пропуск: "Wir ___ morgen nach Berlin."',
      answer: 'fahren',
      explanation_learn_lang: 'Wir fahren morgen nach Berlin.',
      explanation_ui: 'fahren = ехать, уехать.',
      hint: 'Глагол движения.',
      tags: ['travel']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'de',
      type: 'short_translation',
      prompt: 'Переведите: «Я работаю из дома.»',
      answer: 'Ich arbeite von zu Hause.',
      explanation_learn_lang: 'Ich arbeite von zu Hause.',
      explanation_ui: 'von zu Hause = из дома.',
      hint: 'Глагол arbeiten.',
      tags: ['work']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'de',
      type: 'mini_dialog',
      prompt: 'Составьте короткий ответ: "Wie spät ist es?"',
      answer: 'Es ist halb drei.',
      explanation_learn_lang: 'Es ist halb drei.',
      explanation_ui: 'halb drei = 2:30.',
      hint: 'Укажите время.',
      tags: ['culture']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'de',
      type: 'multiple_choice',
      prompt: 'Выберите правильный ответ: "Ich ___ einen Kaffee."',
      options: ['trinke', 'lerne', 'wohne'],
      answer: 'trinke',
      explanation_learn_lang: 'Ich trinke einen Kaffee.',
      explanation_ui: 'trinken = пить.',
      hint: 'Речь о напитке.',
      tags: ['culture']
    }
  ],
  en: [
    {
      id: crypto.randomUUID(),
      learningLanguage: 'en',
      type: 'multiple_choice',
      prompt: 'Choose the correct translation: "Я беру билет на поезд."',
      options: ['I buy a train ticket.', 'I read a book.', 'I write an email.'],
      answer: 'I buy a train ticket.',
      explanation_learn_lang: 'I buy a train ticket.',
      explanation_ui: 'buy + ticket = покупать билет.',
      hint: 'Think of "buy".',
      tags: ['travel']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'en',
      type: 'fill_blank',
      prompt: 'Fill the blank: "She ___ to work every day."',
      answer: 'goes',
      explanation_learn_lang: 'She goes to work every day.',
      explanation_ui: 'Third person singular uses goes.',
      hint: 'Present simple.',
      tags: ['work']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'en',
      type: 'short_translation',
      prompt: 'Translate: "Мне нужно подготовиться к экзамену."',
      answer: 'I need to prepare for the exam.',
      explanation_learn_lang: 'I need to prepare for the exam.',
      explanation_ui: 'prepare for = готовиться к.',
      hint: 'Use "need to".',
      tags: ['exams']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'en',
      type: 'mini_dialog',
      prompt: 'Reply to: "Could you help me?"',
      answer: 'Sure, what do you need?',
      explanation_learn_lang: 'Sure, what do you need?',
      explanation_ui: 'Friendly short reply.',
      hint: 'Start with "Sure".',
      tags: ['culture']
    },
    {
      id: crypto.randomUUID(),
      learningLanguage: 'en',
      type: 'multiple_choice',
      prompt: 'Choose the correct form: "They ___ at the cafe."',
      options: ['are meeting', 'meets', 'meetings'],
      answer: 'are meeting',
      explanation_learn_lang: 'They are meeting at the cafe.',
      explanation_ui: 'Present continuous with are + verb-ing.',
      hint: 'Ongoing action.',
      tags: ['work']
    }
  ]
};

const buildPrompt = (user: { learningLanguage: string; level: string; focus: string }) => {
  return `Generate a language learning task in JSON format. learningLanguage=${user.learningLanguage}, level=${user.level}, focus=${user.focus}. Provide one task.`;
};

const normalizeLearningLanguage = (learningLanguage: string): 'de' | 'en' =>
  learningLanguage === 'en' ? 'en' : 'de';

const requestDeepSeekTask = async (user: { learningLanguage: string; level: string; focus: string }) => {
  const learningLanguage = normalizeLearningLanguage(user.learningLanguage);
  if (!DEEPSEEK_API_KEY) return null;
  const payload = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          'Return ONLY valid JSON that matches the schema: {"id":"uuid","learningLanguage":"de|en","type":"multiple_choice|fill_blank|short_translation|mini_dialog","prompt":"string","options":["string"]?,"answer":"string","explanation_learn_lang":"string","explanation_ui":"string","hint":"string","tags":["string"]}. No extra text.'
      },
      { role: 'user', content: buildPrompt({ ...user, learningLanguage }) }
    ]
  };
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  const parsedJson = JSON.parse(content);
  const result = taskSchema.safeParse(parsedJson);
  if (!result.success) return null;
  return result.data;
};

const getTask = async (user: { learningLanguage: string; level: string; focus: string }) => {
  const learningLanguage = normalizeLearningLanguage(user.learningLanguage);
  const task = await requestDeepSeekTask({ ...user, learningLanguage });
  if (task) return task;
  const options = localTaskTemplates[learningLanguage];
  const next = options[Math.floor(Math.random() * options.length)];
  return { ...next, id: crypto.randomUUID() };
};

const getCurrentLevel = (user: User) =>
  user.learningLanguage === 'de' ? user.levelDe : user.levelEn;

  app.post('/api/lesson/start', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).send('User not found');
    return;
  }
  const lessonLimit = 10;
  const lessonsToday = await computeLessonsToday(userId);
  const isVip = await computeIsVip(userId);
  if (!isVip && lessonsToday >= lessonLimit) {
    res.status(403).send('Daily limit reached');
    return;
  }

  const session = await prisma.lessonSession.create({
    data: {
      userId,
      learningLanguage: user.learningLanguage
    }
  });

  const tasks: TaskInput[] = [];
  for (let i = 0; i < 5; i += 1) {
    const task = await getTask({
      learningLanguage: user.learningLanguage,
      level: getCurrentLevel(user),
      focus: user.focus
    });
    tasks.push(task);
  }

  await prisma.lessonTask.createMany({
    data: tasks.map((task) => ({
      id: task.id,
      sessionId: session.id,
      type: task.type,
      prompt: task.prompt,
      options: task.options ? JSON.stringify(task.options) : null,
      answer: task.answer,
      explanationLearn: task.explanation_learn_lang,
      explanationUi: task.explanation_ui,
      hint: task.hint,
      tags: JSON.stringify(task.tags)
    }))
  });

  res.json({ sessionId: session.id, task: tasks[0], completed: false });
  });

  app.post('/api/lesson/nextTask', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = lessonNextSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const session = await prisma.lessonSession.findUnique({
    where: { id: parsed.data.sessionId },
    include: { tasks: { orderBy: { createdAt: 'asc' } } }
  });
  if (!session || session.userId !== userId) {
    res.status(404).send('Session not found');
    return;
  }
  const nextTask = session.tasks.find((task) => !task.userAnswer);
  if (!nextTask) {
    await prisma.lessonSession.update({
      where: { id: session.id },
      data: { completedAt: new Date() }
    });
    res.json({ sessionId: session.id, task: null, completed: true });
    return;
  }
  res.json({
    sessionId: session.id,
    task: {
      id: nextTask.id,
      learningLanguage: session.learningLanguage,
      type: nextTask.type,
      prompt: nextTask.prompt,
      options: nextTask.options ? (JSON.parse(nextTask.options) as string[]) : undefined,
      answer: nextTask.answer,
      explanation_learn_lang: nextTask.explanationLearn,
      explanation_ui: nextTask.explanationUi,
      hint: nextTask.hint,
      tags: JSON.parse(nextTask.tags) as string[]
    },
    completed: false
  });
  });

  app.post('/api/lesson/answer', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = lessonAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { sessionId, taskId, answer } = parsed.data;
  const task = await prisma.lessonTask.findUnique({ where: { id: taskId } });
  if (!task) {
    res.status(404).send('Task not found');
    return;
  }
  const session = await prisma.lessonSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    res.status(404).send('Session not found');
    return;
  }
  const normalizedAnswer = answer.trim().toLowerCase();
  const correctAnswer = task.answer.trim().toLowerCase();
  const correct = normalizedAnswer === correctAnswer;
  await prisma.lessonTask.update({
    where: { id: taskId },
    data: { userAnswer: answer, correct }
  });
  if (correct) {
    await prisma.lessonSession.update({
      where: { id: session.id },
      data: { score: { increment: 1 } }
    });
  }
  res.json({
    correct,
    task: {
      id: task.id,
      learningLanguage: session.learningLanguage,
      type: task.type,
      prompt: task.prompt,
      options: task.options ? (JSON.parse(task.options) as string[]) : undefined,
      answer: task.answer,
      explanation_learn_lang: task.explanationLearn,
      explanation_ui: task.explanationUi,
      hint: task.hint,
      tags: JSON.parse(task.tags) as string[]
    }
  });
  });

  app.get('/api/ads', authMiddleware, async (_req, res) => {
  const ads = await prisma.ad.findMany();
  res.json(ads);
  });

  app.get('/api/assistant/history', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const messages = await prisma.assistantMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  res.json(
    messages
      .reverse()
      .map((msg) => ({ id: msg.id, role: msg.role, content: msg.content }))
  );
  });

  app.post('/api/assistant/ask', authMiddleware, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = assistantAskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const message = parsed.data.message;
  await prisma.assistantMessage.create({ data: { userId, role: 'user', content: message } });

  let replyContent = 'Скоро отвечу через DeepSeek.';
  if (DEEPSEEK_API_KEY) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful language tutor. Respond in short form.' },
            { role: 'user', content: message }
          ]
        })
      });
      const data = (await response.json()) as any;
      replyContent = data.choices?.[0]?.message?.content || replyContent;
    } catch (error) {
      replyContent = 'Сервис AI временно недоступен.';
    }
  }

  const reply = await prisma.assistantMessage.create({
    data: { userId, role: 'assistant', content: replyContent }
  });

  const oldMessages = await prisma.assistantMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: 10
  });
  if (oldMessages.length > 0) {
    await prisma.assistantMessage.deleteMany({
      where: { id: { in: oldMessages.map((msg) => msg.id) } }
    });
  }

  res.json({ reply: { id: reply.id, role: reply.role, content: reply.content } });
  });

  app.post('/api/payments/test', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const parsed = paymentTestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const plan = parsed.data.plan;
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === '1m') expiresAt.setMonth(expiresAt.getMonth() + 1);
  if (plan === '3m') expiresAt.setMonth(expiresAt.getMonth() + 3);
  if (plan === '12m') expiresAt.setMonth(expiresAt.getMonth() + 12);
  if (plan === 'lifetime') expiresAt.setFullYear(expiresAt.getFullYear() + 50);

  await prisma.payment.create({
    data: {
      userId,
      provider: 'test',
      plan,
      amount: plan === 'lifetime' ? 8990 : 499,
      currency: 'RUB',
      status: 'success'
    }
  });

  await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status: 'active', expiresAt },
    create: { userId, plan, status: 'active', expiresAt }
  });

  res.json({ success: true });
  });

  app.get('/api/payments', authMiddleware, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const payments = await prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.json(payments);
  });

  const ensureAds = async () => {
    const ads = await prisma.ad.count();
    if (ads === 0) {
      await prisma.ad.createMany({
        data: [
          {
            title: 'Deutsch Flow Pro',
            body: 'Разговорная практика без ограничений и персональный AI-коуч.',
            cta: 'Попробовать'
          }
        ]
      });
    }
  };

  return { app, prisma, ensureAds };
};

export { createApp };
