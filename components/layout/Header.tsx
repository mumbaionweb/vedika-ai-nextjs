'use client';

import VedikaCoins from '@/components/ui/VedikaCoins';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white flex items-center px-4 lg:px-6 flex-shrink-0 relative z-20">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors mr-3"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-secondary-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Header content */}
      <div className="flex-1 flex items-center justify-end">
        {/* Vedika Coins Display */}
        <VedikaCoins />
      </div>
    </header>
  );
}

