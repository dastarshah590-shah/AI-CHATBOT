import { getOpenAIClient } from "../config/openai.js";

export const purposePrompt =
  "Hi! What are you here for today: learning about our services, checking business hours, booking an appointment, refund policy, language support, or speaking with a support agent?";

const fallbackReply =
  "I can help with services, business hours, booking requests, refund policy, and language support. Tell me which topic you mean and I will guide you.";

export const buildBusinessContext = () => {
  const name = process.env.BUSINESS_NAME || "SmartBot AI Demo Company";
  const hours = process.env.BUSINESS_HOURS || "Monday to Saturday, 9 AM to 6 PM";
  const services =
    process.env.BUSINESS_SERVICES ||
    "customer support automation, FAQ handling, booking assistance, analytics, and human handoff";

  return `Business name: ${name}\nBusiness hours: ${hours}\nServices: ${services}`;
};

const toResponseText = (response) => {
  if (response?.output_text) {
    return response.output_text;
  }

  if (Array.isArray(response?.output)) {
    return response.output
      .flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("")
      .trim();
  }

  return "";
};

const greetingPattern = /^(hi|hello|hey|salam|assalam|good morning|good afternoon|good evening)\b/i;

const categoryReplies = {
  General: () =>
    "We are open Monday to Saturday from 9 AM to 6 PM. If you message outside those hours, share what you need and the team can follow up when they are back online.",
  Services: () =>
    "SmartBot AI helps businesses with customer support automation, FAQ answers, booking assistance, analytics dashboards, multilingual detection, and handoff to a human team when needed. Tell me your main use case and I can point you to the best feature.",
  Bookings: () =>
    "To create a booking request, send your name, email, phone number, service type, preferred date, and preferred time. Once you share those details, I can save the request for the admin team.",
  Policy: () =>
    "Refund requests are reviewed by the support team. Share your order details, purchase email, and the reason for the refund so the team has enough context to review it properly.",
  Support: () =>
    "Yes, SmartBot AI can detect common languages and reply in the same language when possible. You can send your question in the language you are most comfortable using."
};

const uniqueFAQs = (faqs = []) => {
  const seen = new Set();
  return faqs.filter((faq) => {
    const key = faq.id || `${faq.category}-${faq.question}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const generateLocalReply = ({ message, faqs = [], matchedFaqs = [] }) => {
  if (greetingPattern.test(message.trim())) {
    return purposePrompt;
  }

  const relatedFAQs = uniqueFAQs(matchedFaqs);
  if (relatedFAQs.length > 0) {
    const primary = relatedFAQs[0];
    const categoryReply = categoryReplies[primary.category];

    if (categoryReply) {
      return categoryReply(primary);
    }

    return `That sounds related to ${primary.category.toLowerCase()}. ${primary.answer} Tell me a little more about what you need and I will narrow it down.`;
  }

  if (faqs.length > 0) {
    const topics = [...new Set(faqs.map((faq) => faq.category.toLowerCase()))].join(", ");
    return `I do not have enough detail to answer that confidently yet. I can help with ${topics}. Which of those is closest to what you need?`;
  }

  return fallbackReply;
};

export const generateBotReply = async ({ message, conversationHistory = [], faqs = [], matchedFaqs = [] }) => {
  const client = getOpenAIClient();

  if (!client) {
    return generateLocalReply({ message, faqs, matchedFaqs });
  }

  const historyText = conversationHistory
    .slice(-10)
    .map((entry) => `${entry.senderType}: ${entry.message}`)
    .join("\n");
  const relatedFaqs = uniqueFAQs([...matchedFaqs, ...faqs]);
  const faqText = relatedFaqs
    .slice(0, 12)
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");

  const systemPrompt = `You are SmartBot AI, a helpful and professional customer support assistant.
Answer clearly and briefly. Use only the provided business context and FAQ data when specific facts are needed.
Synthesize the best answer for the user's wording instead of copying FAQ text word-for-word.
Ask follow-up questions when required. Do not invent prices, policies, or booking availability.
If the customer asks for a human or the issue is sensitive, say you will connect them with a human support agent.
Reply in the same language as the customer when possible.

Business Context:
${buildBusinessContext()}

FAQ Data:
${faqText || "No FAQ data available."}

Conversation History:
${historyText || "No previous messages."}`;

  try {
    if (client.responses?.create) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      });
      return toResponseText(response) || fallbackReply;
    }

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.4
    });

    return response.choices?.[0]?.message?.content || fallbackReply;
  } catch (error) {
    console.error("OpenAI error:", error.message);
    return "Sorry, I am having trouble responding right now. I can connect you with a human support agent.";
  }
};
