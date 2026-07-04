import { isMongoConnected } from "../config/db.js";
import { memoryStore } from "../data/memoryStore.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { normalizeDoc } from "../utils/responseFormatter.js";
import { createBooking } from "./bookingService.js";
import { findRelatedFAQs, listFAQs } from "./faqService.js";
import { generateBotReply, purposePrompt } from "./openaiService.js";

const languageRules = [
  { code: "ur", pattern: /[\u0600-\u06FF]/ },
  { code: "hi", pattern: /[\u0900-\u097F]/ },
  { code: "es", pattern: /\b(hola|gracias|precio|servicio|reserva)\b/i },
  { code: "fr", pattern: /\b(bonjour|merci|prix|service|reservation)\b/i },
  { code: "de", pattern: /\b(hallo|danke|preis|dienst|termin)\b/i }
];

const escalationPattern =
  /\b(human|agent|representative|manager|complaint|angry|upset|lawsuit|legal|payment failed|refund now|speak to someone)\b/i;
const bookingActionPattern =
  /(?:\b(?:i want|i need|i would like|please|can you|could you|help me)\b.{0,40}\b(?:book|schedule|reserve|appointment|consultation|demo|meeting)\b)|^(?:book|schedule|reserve)\b/i;

export const detectLanguage = (message = "") => {
  const match = languageRules.find((rule) => rule.pattern.test(message));
  return match?.code || "en";
};

export const detectIntent = (message = "") => {
  if (escalationPattern.test(message)) {
    return "handoff";
  }

  if (bookingActionPattern.test(message.trim())) {
    return "booking";
  }

  if (/^(hi|hello|hey|salam|assalam)/i.test(message.trim())) {
    return "greeting";
  }

  return "support";
};

const parseBookingDetails = (messages) => {
  const text = messages.map((message) => message.message).join(" ");
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(\+?\d[\d\s().-]{6,}\d)/)?.[0]?.trim();
  const isoDate = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const time =
    text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\s?(?:am|pm|AM|PM)?\b/)?.[0] ||
    text.match(/\b(?:1[0-2]|0?[1-9])\s?(?:am|pm|AM|PM)\b/)?.[0];
  const name =
    text.match(/\b(?:my name is|name is|i am|i'm)\s+([a-z][a-z\s]{1,40})/i)?.[1]?.trim() ||
    text.match(/\bname:\s*([a-z][a-z\s]{1,40})/i)?.[1]?.trim();
  const serviceType =
    text.match(/\b(?:service|for|type):?\s*(consultation|demo|support|automation|booking|setup)\b/i)?.[1] ||
    (/\bconsultation\b/i.test(text) ? "Consultation" : "");

  let preferredDate = isoDate;
  if (!preferredDate && /\btomorrow\b/i.test(text)) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    preferredDate = date.toISOString().slice(0, 10);
  }
  if (!preferredDate && /\btoday\b/i.test(text)) {
    preferredDate = new Date().toISOString().slice(0, 10);
  }

  const details = {
    name,
    email,
    phone,
    serviceType,
    preferredDate,
    preferredTime: time,
    notes: text.slice(-280)
  };

  const missing = Object.entries(details)
    .filter(([key, value]) => ["name", "email", "phone", "serviceType", "preferredDate", "preferredTime"].includes(key) && !value)
    .map(([key]) => key);

  return { details, missing };
};

export const createConversation = async ({ customerId, source = "website", language = "en" } = {}) => {
  if (isMongoConnected()) {
    return normalizeDoc(await Conversation.create({ customerId, source, language }));
  }

  return memoryStore.conversations.create({ customerId, source, language });
};

export const getConversation = async (conversationId) => {
  if (isMongoConnected()) {
    return normalizeDoc(await Conversation.findById(conversationId));
  }

  return memoryStore.conversations.get(conversationId);
};

export const updateConversation = async (conversationId, payload) => {
  if (isMongoConnected()) {
    return normalizeDoc(await Conversation.findByIdAndUpdate(conversationId, payload, { new: true }));
  }

  return memoryStore.conversations.update(conversationId, payload);
};

export const addMessage = async (payload) => {
  if (isMongoConnected()) {
    const message = await Message.create(payload);
    await Conversation.findByIdAndUpdate(payload.conversationId, { updatedAt: new Date() });
    return normalizeDoc(message);
  }

  return memoryStore.messages.create(payload);
};

export const getMessages = async (conversationId) => {
  if (isMongoConnected()) {
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return messages.map(normalizeDoc);
  }

  return memoryStore.messages.listByConversation(conversationId);
};

export const listConversations = async (filter = {}) => {
  if (isMongoConnected()) {
    const query = filter.status ? { status: filter.status } : {};
    const conversations = await Conversation.find(query).sort({ updatedAt: -1 }).limit(50);
    return Promise.all(
      conversations.map(async (conversation) => {
        const normalized = normalizeDoc(conversation);
        const lastMessage = await Message.findOne({ conversationId: normalized.id }).sort({ createdAt: -1 });
        return {
          ...normalized,
          lastMessage: lastMessage ? normalizeDoc(lastMessage) : null
        };
      })
    );
  }

  return memoryStore.conversations.list(filter).map((conversation) => {
    const messages = memoryStore.messages.listByConversation(conversation.id);
    return {
      ...conversation,
      lastMessage: messages.at(-1) || null
    };
  });
};

export const handleCustomerMessage = async ({ conversationId, message, customerId, source = "website" }) => {
  const language = detectLanguage(message);
  let conversation = conversationId ? await getConversation(conversationId) : null;

  if (!conversation) {
    conversation = await createConversation({ customerId, source, language });
  }

  const intent = detectIntent(message);

  const customerMessage = await addMessage({
    conversationId: conversation.id,
    senderType: "customer",
    senderId: customerId,
    message,
    intent,
    confidence: 1,
    isEscalated: intent === "handoff"
  });

  const history = await getMessages(conversation.id);

  if (intent === "handoff") {
    await updateConversation(conversation.id, {
      status: "escalated",
      language,
      escalationReason: "Customer requested human support or used escalation language"
    });

    const botMessage = await addMessage({
      conversationId: conversation.id,
      senderType: "bot",
      message: "I understand. I am connecting this conversation to a human support agent now.",
      intent,
      confidence: 0.95,
      isEscalated: true
    });

    return {
      conversationId: conversation.id,
      customerMessage,
      botMessage,
      reply: botMessage.message,
      escalated: true,
      intent,
      confidence: 0.95
    };
  }

  if (intent === "greeting") {
    await updateConversation(conversation.id, { language });

    const botMessage = await addMessage({
      conversationId: conversation.id,
      senderType: "bot",
      message: purposePrompt,
      intent,
      confidence: 0.94
    });

    return {
      conversationId: conversation.id,
      customerMessage,
      botMessage,
      reply: botMessage.message,
      escalated: false,
      intent,
      confidence: 0.94
    };
  }

  if (intent === "booking") {
    const { details, missing } = parseBookingDetails(history);

    if (missing.length === 0) {
      const booking = await createBooking({
        ...details,
        conversationId: conversation.id,
        customerId
      });
      const botMessage = await addMessage({
        conversationId: conversation.id,
        senderType: "bot",
        message: `Thanks, ${details.name}. Your ${details.serviceType} booking request for ${details.preferredDate} at ${details.preferredTime} has been saved as ${booking.status}.`,
        intent,
        confidence: 0.92
      });

      return {
        conversationId: conversation.id,
        customerMessage,
        botMessage,
        booking,
        reply: botMessage.message,
        escalated: false,
        intent,
        confidence: 0.92
      };
    }

    const fieldNames = missing
      .map((field) =>
        field
          .replace("serviceType", "service type")
          .replace("preferredDate", "preferred date")
          .replace("preferredTime", "preferred time")
      )
      .join(", ");
    const botMessage = await addMessage({
      conversationId: conversation.id,
      senderType: "bot",
      message: `Sure. Please share your ${fieldNames} so I can create the booking request.`,
      intent,
      confidence: 0.86
    });

    return {
      conversationId: conversation.id,
      customerMessage,
      botMessage,
      reply: botMessage.message,
      escalated: false,
      intent,
      confidence: 0.86
    };
  }

  const faqs = await listFAQs(false);
  const relatedFAQMatches = await findRelatedFAQs(message, faqs, 3);
  const matchedFaqs = relatedFAQMatches.map((match) => match.faq);
  const bestFAQMatch = relatedFAQMatches[0] || null;
  const reply = await generateBotReply({ message, conversationHistory: history, faqs, matchedFaqs });
  const shouldEscalate = /\b(?:transfer|escalate|connecting?|send)\b.{0,50}\b(?:human|agent|representative)\b/i.test(reply);
  const confidence = shouldEscalate ? 0.45 : bestFAQMatch?.confidence || 0.72;

  const botMessage = await addMessage({
    conversationId: conversation.id,
    senderType: "bot",
    message: reply,
    intent: bestFAQMatch ? "faq" : intent,
    confidence,
    isEscalated: shouldEscalate
  });

  if (shouldEscalate) {
    await updateConversation(conversation.id, {
      status: "escalated",
      language,
      escalationReason: "AI fallback suggested human support"
    });
  } else {
    await updateConversation(conversation.id, { language });
  }

  return {
    conversationId: conversation.id,
    customerMessage,
    botMessage,
    reply,
    escalated: shouldEscalate,
    intent: bestFAQMatch ? "faq" : intent,
    confidence
  };
};

export const escalateConversation = async ({ conversationId, reason = "Customer requested human support" }) => {
  const conversation = await updateConversation(conversationId, {
    status: "escalated",
    escalationReason: reason
  });

  if (!conversation) {
    return null;
  }

  const message = await addMessage({
    conversationId,
    senderType: "bot",
    message: "This conversation has been escalated to a human support agent.",
    intent: "handoff",
    confidence: 0.96,
    isEscalated: true
  });

  return { conversation, message };
};

export const agentReply = async ({ conversationId, message, agentId }) => {
  const conversation = await updateConversation(conversationId, {
    status: "escalated",
    assignedAgentId: agentId
  });

  if (!conversation) {
    return null;
  }

  return addMessage({
    conversationId,
    senderType: "agent",
    senderId: agentId,
    message,
    intent: "agent_reply",
    confidence: 1
  });
};

export const closeConversation = async ({ conversationId, satisfactionRating }) => {
  return updateConversation(conversationId, {
    status: "resolved",
    endedAt: new Date(),
    satisfactionRating
  });
};
