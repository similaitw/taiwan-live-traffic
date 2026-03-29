import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '全台監視器即時查詢',
  description: '整合國道、省道、縣市道路即時影像，快速搜尋全台監視器',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-gray-50 text-gray-900 antialiased h-full">{children}</body>
    </html>
  );
}
