# LLM Chat App


https://github.com/user-attachments/assets/ad7f83eb-85d9-4c74-a82d-adaa3e894b2e



A React Native chat application that streams responses from Google Gemini in real time, with multi-conversation management and a typewriter rendering effect.

---

## What the app does

- Start multiple independent chat conversations with Gemini Flash.
- Responses stream token-by-token via SSE (Server-Sent Events) and are rendered with a typewriter effect — characters are dripped out at a rate proportional to how full the buffer is, keeping the UI smooth without falling behind the network.
- While a response is generating, a blinking cursor trails the text and three animated dots appear when the model hasn't produced any text yet ("thinking" state).
- Each conversation is auto-titled from the first user message (up to 50 chars).
- The conversation list shows a preview of the last message and a relative timestamp (e.g. "3m ago").
- Any in-flight stream can be cancelled with the stop button; sending a new message while one is streaming cancels the previous one cleanly.

---

## Folder structure

```
llmChatApp/
├── App.tsx                         # Root component — screen routing & conversation state
├── index.js                        # React Native entry point
├── .env                            # GEMINI_API_KEY (loaded via react-native-dotenv)
│
├── src/
│   ├── types.ts                    # Shared types: Message, Conversation
│   ├── ChatScreen.tsx              # Active chat UI — orchestrates send/stop/stream
│   │
│   ├── screens/
│   │   └── ConversationListScreen.tsx  # Home screen: list, create, delete conversations
│   │
│   ├── components/
│   │   ├── ChatHeader.tsx          # Top bar with back button and conversation title
│   │   ├── InputBar.tsx            # Text input + send/stop button
│   │   ├── MessageList.tsx         # FlatList wrapper with auto-scroll-to-bottom
│   │   ├── MessageBubble.tsx       # Single message bubble (user/assistant/error/thinking)
│   │   └── BlinkingCursor.tsx      # Animated ▍ cursor shown while streaming
│   │
│   ├── hooks/
│   │   ├── useConversations.ts     # In-memory CRUD for the conversations array
│   │   └── useStreamBuffer.ts      # Typewriter engine: drips characters from a buffer
│   │
│   ├── network/
│   │   ├── GeminiRepository.ts     # XHR-based SSE streaming to Gemini API
│   │   └── types.ts                # ChatMessage, StreamCallbacks, StreamHandle
│   │
│   └── env.d.ts                    # Type declaration for @env (react-native-dotenv)
│
├── __tests__/
│   └── App.test.tsx                # Smoke test
│
├── android/                        # Android native project
├── ios/                            # iOS native project (Xcode workspace + CocoaPods)
├── package.json
└── tsconfig.json
```

---

## Code walkthrough

### `App.tsx` — root router

Holds the full list of conversations in `useConversations` and a single `activeId` that determines which screen to show. When `activeId` is `null` the conversation list is shown; when set, `ChatScreen` is rendered with `key={activeId}` so React remounts it cleanly (resetting all local state and cancelling any in-flight streams) whenever the user switches conversations.

```
ConversationListScreen  ──onNew / onSelect──▶  ChatScreen (key = conv.id)
                        ◀──────onBack──────────
```

---

### `src/hooks/useConversations.ts` — conversation store

Plain `useState` array. Exposes `createConversation`, `updateMessages`, `updateTitle`, and `deleteConversation`. No persistence — state lives in memory for the session.

---

### `src/network/GeminiRepository.ts` — streaming layer

Calls the Gemini `streamGenerateContent` SSE endpoint using `XMLHttpRequest`. XHR was chosen over `fetch` because React Native's Hermes engine does not expose a usable `ReadableStream` from fetch responses, while XHR's `onprogress` fires incrementally and is a reliable streaming primitive on both iOS and Android.

Each `onprogress` event slices new bytes off `xhr.responseText`, splits by `\n`, and parses JSON from any `data: {...}` lines to extract the text token. The returned `StreamHandle` wraps `xhr.abort()` for clean cancellation.

---

### `src/hooks/useStreamBuffer.ts` — typewriter engine

Decouples network speed from render speed. Incoming tokens are appended to a string buffer (`bufRef`). A `setInterval` running every 16 ms drips characters out of the front of the buffer:

| Buffer size | Chars per tick |
|-------------|----------------|
| ≤ 20        | 1              |
| ≤ 80        | 3              |
| > 80        | `ceil(len/25)` |

This keeps the animation smooth when the buffer is small and catches up quickly when the model is fast and the buffer grows large. When the network signals completion (`markNetworkDone`) and the buffer empties, the interval fires `onDone` and stops.

---

### `src/ChatScreen.tsx` — chat orchestrator

Owns the per-conversation message array, draft text, and streaming state. On send:

1. Cancels any current stream and typewriter.
2. Pushes a user message and an empty assistant message (marked `streaming: true`) into state.
3. Calls `streamChat` from `GeminiRepository`, piping tokens into `useStreamBuffer.enqueue`.
4. The typewriter drips characters into the assistant message via `setMessages` in `onChar`.
5. On completion or error, the message is marked `streaming: false` and the parent is notified via `onMessagesChange`.

A `generationRef` counter guards against stale callbacks from a previous stream firing after a new send.

---

### `src/components/MessageBubble.tsx` — message rendering

Three visual states:
- **Thinking** (`streaming === true`, `content === ''`): three animated dots with staggered opacity pulses.
- **Streaming** (`streaming === true`, `content !== ''`): text + blinking `▍` cursor.
- **Done / Error**: plain text bubble, red tint on error.

---

## Setup

1. Install dependencies:
   ```bash
   npm install
   cd ios && pod install
   ```

2. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. Run:
   ```bash
   npm run ios     # or npm run android
   ```
