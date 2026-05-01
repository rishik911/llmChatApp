export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface StreamHandle {
  abort: () => void;
}
