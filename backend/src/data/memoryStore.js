import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { defaultFAQs, demoUsers } from "./defaultData.js";

const state = {
  seeded: false,
  users: [],
  conversations: [],
  messages: [],
  faqs: [],
  bookings: []
};

const now = () => new Date();

const stamp = (record, existing = {}) => ({
  ...record,
  createdAt: existing.createdAt || now(),
  updatedAt: now()
});

const publicUser = (user) => {
  if (!user) {
    return null;
  }

  const { passwordHash, ...rest } = user;
  return rest;
};

export const memoryStore = {
  state,

  async seed() {
    if (state.seeded) {
      return;
    }

    for (const demoUser of demoUsers) {
      state.users.push(
        stamp({
          id: randomUUID(),
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          language: "en",
          passwordHash: await bcrypt.hash(demoUser.password, 10)
        })
      );
    }

    for (const faq of defaultFAQs) {
      state.faqs.push(stamp({ id: randomUUID(), ...faq }));
    }

    state.seeded = true;
  },

  users: {
    findByEmail(email) {
      return state.users.find((user) => user.email === email.toLowerCase()) || null;
    },
    create(data) {
      const user = stamp({
        id: randomUUID(),
        ...data,
        email: data.email.toLowerCase()
      });
      state.users.push(user);
      return publicUser(user);
    },
    publicUser
  },

  faqs: {
    list(includeInactive = false) {
      return state.faqs
        .filter((faq) => includeInactive || faq.isActive)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create(data) {
      const faq = stamp({ id: randomUUID(), isActive: true, language: "en", category: "General", ...data });
      state.faqs.unshift(faq);
      return faq;
    },
    update(id, data) {
      const index = state.faqs.findIndex((faq) => faq.id === id);
      if (index === -1) {
        return null;
      }
      state.faqs[index] = stamp({ ...state.faqs[index], ...data }, state.faqs[index]);
      return state.faqs[index];
    },
    remove(id) {
      const index = state.faqs.findIndex((faq) => faq.id === id);
      if (index === -1) {
        return false;
      }
      state.faqs.splice(index, 1);
      return true;
    }
  },

  conversations: {
    create(data = {}) {
      const conversation = stamp({
        id: randomUUID(),
        status: "active",
        source: "website",
        language: "en",
        startedAt: now(),
        ...data
      });
      state.conversations.unshift(conversation);
      return conversation;
    },
    get(id) {
      return state.conversations.find((conversation) => conversation.id === id) || null;
    },
    list(filter = {}) {
      return state.conversations
        .filter((conversation) => {
          if (filter.status && conversation.status !== filter.status) {
            return false;
          }
          return true;
        })
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    update(id, data) {
      const index = state.conversations.findIndex((conversation) => conversation.id === id);
      if (index === -1) {
        return null;
      }
      state.conversations[index] = stamp({ ...state.conversations[index], ...data }, state.conversations[index]);
      return state.conversations[index];
    }
  },

  messages: {
    create(data) {
      const message = stamp({
        id: randomUUID(),
        confidence: 1,
        isEscalated: false,
        ...data
      });
      state.messages.push(message);
      memoryStore.conversations.update(data.conversationId, {});
      return message;
    },
    listByConversation(conversationId) {
      return state.messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    listCustomerMessages() {
      return state.messages.filter((message) => message.senderType === "customer");
    }
  },

  bookings: {
    create(data) {
      const booking = stamp({
        id: randomUUID(),
        status: "pending",
        ...data
      });
      state.bookings.unshift(booking);
      return booking;
    },
    list() {
      return state.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    update(id, data) {
      const index = state.bookings.findIndex((booking) => booking.id === id);
      if (index === -1) {
        return null;
      }
      state.bookings[index] = stamp({ ...state.bookings[index], ...data }, state.bookings[index]);
      return state.bookings[index];
    }
  }
};
