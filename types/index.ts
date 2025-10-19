export interface User {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}

