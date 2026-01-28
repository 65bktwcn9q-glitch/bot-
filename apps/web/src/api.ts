export type ApiUser = {
  id: string;
  uiLanguage: 'ru' | 'de' | 'en';
  learningLanguage: 'de' | 'en';
  levelDe: 'A1' | 'A2' | 'B1' | 'B2';
  levelEn: 'A1' | 'A2' | 'B1' | 'B2';
  focus: string;
  onboarded: boolean;
  isVip: boolean;
  lessonsToday: number;
  lessonsLimit: number;
  weekProgress: number;
};

export type LessonTask = {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'short_translation' | 'mini_dialog';
  prompt: string;
  options?: string[];
  answer?: string;
  explanation_learn_lang?: string;
  explanation_ui?: string;
  hint?: string;
  tags?: string[];
};

export type LessonSession = {
  sessionId: string;
  task: LessonTask | null;
  completed: boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

const getToken = () => localStorage.getItem('df_token') ?? '';

export const setToken = (token: string) => {
  localStorage.setItem('df_token', token);
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'API error');
  }
  return res.json() as Promise<T>;
};
