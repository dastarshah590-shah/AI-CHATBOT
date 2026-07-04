import { isMongoConnected } from "../config/db.js";
import { memoryStore } from "../data/memoryStore.js";
import { FAQ } from "../models/FAQ.js";
import { normalizeDoc } from "../utils/responseFormatter.js";

const stopWords = new Set([
  "the",
  "a",
  "an",
  "are",
  "you",
  "your",
  "what",
  "when",
  "where",
  "how",
  "can",
  "for",
  "with",
  "and",
  "that",
  "this",
  "have",
  "from",
  "tell",
  "about",
  "please",
  "need",
  "want",
  "like",
  "know",
  "info",
  "information",
  "details",
  "explain",
  "show",
  "give",
  "me"
]);

const topicKeywords = {
  General: [
    "hours",
    "hour",
    "open",
    "close",
    "closed",
    "timing",
    "time",
    "schedule",
    "working",
    "available",
    "today",
    "tomorrow",
    "saturday",
    "weekday",
    "weekend"
  ],
  Services: [
    "service",
    "services",
    "offer",
    "offers",
    "provide",
    "feature",
    "features",
    "automation",
    "chatbot",
    "bot",
    "faq",
    "analytics",
    "dashboard",
    "handoff",
    "customer",
    "business",
    "support"
  ],
  Bookings: [
    "book",
    "booking",
    "appointment",
    "schedule",
    "reservation",
    "reserve",
    "consultation",
    "demo",
    "meeting",
    "call",
    "slot"
  ],
  Policy: [
    "refund",
    "return",
    "policy",
    "cancel",
    "cancellation",
    "money",
    "payment",
    "charge",
    "order",
    "reimburse"
  ],
  Support: [
    "language",
    "languages",
    "multilingual",
    "translate",
    "translation",
    "urdu",
    "hindi",
    "english",
    "spanish",
    "arabic",
    "reply"
  ]
};

const synonymGroups = [
  ["hours", "hour", "timing", "time", "open", "close", "schedule", "working"],
  ["service", "services", "offer", "provide", "feature", "features", "automation", "chatbot", "bot"],
  ["book", "booking", "appointment", "schedule", "reservation", "reserve", "consultation", "demo", "meeting"],
  ["refund", "return", "cancel", "cancellation", "money", "payment", "charge", "reimburse"],
  ["language", "languages", "multilingual", "translate", "translation", "urdu", "hindi", "english"]
];

const normalizeToken = (token) => {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.length > 3 && token.endsWith("s")) {
    return token.slice(0, -1);
  }

  return token;
};

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length > 2 && !stopWords.has(token));

const expandTokens = (tokens) => {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const group = synonymGroups.find((items) => items.includes(token));
    group?.forEach((item) => expanded.add(item));
  }

  return expanded;
};

const faqTokens = (faq) =>
  new Set([
    ...tokenize(`${faq.question} ${faq.answer} ${faq.category}`),
    ...(topicKeywords[faq.category] || []).map(normalizeToken)
  ]);

const rankFAQs = (message, faqs) => {
  const queryTokens = tokenize(message);

  if (queryTokens.length === 0) {
    return [];
  }

  const expandedQuery = expandTokens(queryTokens);
  const normalizedMessage = message.toLowerCase();

  return faqs
    .map((faq) => {
      const targetTokens = faqTokens(faq);
      const directQuestionHit =
        faq.question.toLowerCase().includes(normalizedMessage) ||
        normalizedMessage.includes(faq.question.toLowerCase());
      const overlap = [...expandedQuery].filter((token) => targetTokens.has(token)).length;
      const topicHit = (topicKeywords[faq.category] || []).some((keyword) =>
        expandedQuery.has(normalizeToken(keyword))
      );
      const categoryHit = normalizedMessage.includes(faq.category.toLowerCase());
      const score = directQuestionHit
        ? 1
        : Math.min(0.99, overlap / Math.max(expandedQuery.size, 1) + (topicHit ? 0.28 : 0) + (categoryHit ? 0.18 : 0));

      return {
        faq,
        confidence: Math.min(0.96, Number((0.56 + score / 2).toFixed(2))),
        score
      };
    })
    .filter((match) => match.score >= 0.24)
    .sort((a, b) => b.score - a.score);
};

export const listFAQs = async (includeInactive = false) => {
  if (isMongoConnected()) {
    const filter = includeInactive ? {} : { isActive: true };
    const faqs = await FAQ.find(filter).sort({ createdAt: -1 });
    return faqs.map(normalizeDoc);
  }

  return memoryStore.faqs.list(includeInactive);
};

export const createFAQ = async (payload) => {
  if (isMongoConnected()) {
    return normalizeDoc(await FAQ.create(payload));
  }

  return memoryStore.faqs.create(payload);
};

export const updateFAQ = async (id, payload) => {
  if (isMongoConnected()) {
    return normalizeDoc(await FAQ.findByIdAndUpdate(id, payload, { new: true }));
  }

  return memoryStore.faqs.update(id, payload);
};

export const deleteFAQ = async (id) => {
  if (isMongoConnected()) {
    const deleted = await FAQ.findByIdAndDelete(id);
    return Boolean(deleted);
  }

  return memoryStore.faqs.remove(id);
};

export const findRelatedFAQs = async (message, faqs = null, limit = 3) => {
  const sourceFAQs = faqs || (await listFAQs(false));
  return rankFAQs(message, sourceFAQs).slice(0, limit);
};

export const findMatchingFAQ = async (message, faqs = null) => {
  return (await findRelatedFAQs(message, faqs, 1))[0] || null;
};
