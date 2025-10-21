'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-secondary-200 py-4">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-secondary-600">
        <p>&copy; {new Date().getFullYear()} V.ai - Vedika AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
