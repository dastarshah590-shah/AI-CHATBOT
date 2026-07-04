# SmartBot AI

AI-powered business support chatbot with real-time chat, FAQ handling, booking requests, human handoff, admin management, analytics, MongoDB models, and OpenAI integration.

Deployment instructions are intentionally excluded.

## Stack

- React + Vite frontend
- Node.js + Express backend
- Socket.io real-time messaging
- MongoDB + Mongoose models
- OpenAI Responses API integration from the backend
- JWT authentication for admins and agents

## Local URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Demo Accounts

These accounts are seeded automatically in MongoDB, or in memory when MongoDB is not available.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@smartbot.local | password123 |
| Agent | agent@smartbot.local | password123 |

## Setup

Install dependencies from the project root:

```bash
npm install
```

Optional backend environment file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartbot_ai
JWT_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
CLIENT_URL=http://localhost:3000
BUSINESS_NAME=SmartBot AI Demo Company
BUSINESS_HOURS=Monday to Saturday, 9 AM to 6 PM
BUSINESS_SERVICES=customer support automation, FAQ handling, bookings, analytics, and human handoff
```

Optional frontend environment file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

If MongoDB is not running, the backend starts with in-memory data so the project remains usable for demos and testing.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/chat/message`
- `GET /api/chat/conversations`
- `GET /api/chat/conversations/:conversationId`
- `POST /api/chat/escalate`
- `POST /api/chat/conversations/:conversationId/agent-reply`
- `POST /api/chat/conversations/:conversationId/resolve`
- `GET /api/faqs`
- `POST /api/faqs`
- `PUT /api/faqs/:id`
- `DELETE /api/faqs/:id`
- `POST /api/bookings`
- `GET /api/bookings`
- `PUT /api/bookings/:id/status`
- `GET /api/analytics/dashboard`

## Notes

- OpenAI API keys stay on the backend only.
- Admin and agent routes use JWT role checks.
- FAQ responses are matched before OpenAI calls to reduce cost.
- Unknown or sensitive issues can be escalated to human support.
- Socket.io events support joining conversations, customer messages, typing, handoff requests, agent replies, and escalation notifications.
