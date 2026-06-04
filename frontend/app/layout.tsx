import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI Tutor OS — Your Personal Free AI Teacher',
  description: 'Transform any PDF or notes into a personalized AI teacher. Voice, chat, quiz — 100% free.',
   verification: {
    google: 'e2525596656b33de',   // ← add this line
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', fontSize: '14px' },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
