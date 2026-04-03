// --- API ---
export const API_BASE_URL = 'http://localhost:8080';

// --- Paginare ---
export const DEFAULT_PAGE_SIZE = 10;
export const MESSAGES_PAGE_SIZE = 20;
export const SESSIONS_PAGE_SIZE = 10;
export const ANALYSIS_PAGE_SIZE = 20;

// --- XP si niveluri ---
export const XP_PER_LEVEL = 100;

// --- Algoritmul SM-2 — valori quality mapate pe butoane ---
export const REVIEW_QUALITY = {
  AGAIN: 0,
  HARD: 2,
  GOOD: 3,
  EASY: 5,
} as const;

// Praguri SM-2 pentru clasificarea cardurilor
export const SM2_MATURE_INTERVAL_DAYS = 21;
export const SM2_LEARNING_REPETITION_THRESHOLD = 3;

// --- Chatbot ---
export const AI_RESPONSE_PREVIEW_LENGTH = 60;

// --- Analysis ---
export const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]+/;
export const DEFAULT_TRANSLATION_LANGUAGE = 'en' as const;