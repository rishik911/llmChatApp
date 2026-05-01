export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
