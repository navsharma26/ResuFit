import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResuFit | Requirement Gap Analysis Matrix',
  description: 'AI-Powered ATS Requirement Gap Analysis Engine using Next.js, Express, TypeScript, and OpenAI gpt-4o-mini',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
