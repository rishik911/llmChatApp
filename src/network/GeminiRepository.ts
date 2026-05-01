import { GEMINI_API_KEY } from '@env';
import type { ChatMessage, StreamCallbacks, StreamHandle } from './types';

// Trade-off: XHR over fetch() or the browser EventSource API.
// • EventSource is read-only (no POST body) — ruled out for chat.
// • fetch() with a ReadableStream reader works on web but React Native's
//   Hermes engine does not expose a usable ReadableStream from fetch responses
//   (as of RN 0.85). XHR's onprogress fires incrementally and is the only
//   reliable streaming primitive in React Native today.
// • The exposed StreamHandle.abort() wraps xhr.abort(), giving callers a
//   clean cancellation API without leaking the XHR internals.

const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse';

// Gemini SSE lines look like:
//   data: {"candidates":[{"content":{"parts":[{"text":"..."}],"role":"model"},...}]}
// Each progressive XHR chunk may contain multiple data: lines.
function extractTokens(raw: string): string[] {
  const tokens: string[] = [];
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const payload = line.slice(6).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const text: string | undefined =
        JSON.parse(payload)?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) tokens.push(text);
    } catch {
      // skip malformed chunks
    }
  }
  return tokens;
}

function buildBody(messages: ChatMessage[]): string {
  return JSON.stringify({
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  });
}

export function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
): StreamHandle {
  const xhr = new XMLHttpRequest();
  let cursor = 0;
  let settled = false;

  function settle(fn: () => void) {
    if (settled) return;
    settled = true;
    fn();
  }

  xhr.open('POST', ENDPOINT);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-goog-api-key', GEMINI_API_KEY);

  xhr.onprogress = () => {
    const newChunk = xhr.responseText.slice(cursor);
    cursor = xhr.responseText.length;
    for (const token of extractTokens(newChunk)) {
      callbacks.onToken(token);
    }
  };

  xhr.onload = () => {
    // flush any remaining bytes not caught by the last onprogress
    const tail = xhr.responseText.slice(cursor);
    if (tail) {
      for (const token of extractTokens(tail)) {
        callbacks.onToken(token);
      }
    }
    settle(() => callbacks.onComplete());
  };

  xhr.onerror = () =>
    settle(() => callbacks.onError(new Error('Network request failed')));

  xhr.onabort = () =>
    settle(() => callbacks.onComplete()); // treat abort as a clean stop

  xhr.send(buildBody(messages));

  return {
    abort: () => xhr.abort(),
  };
}
