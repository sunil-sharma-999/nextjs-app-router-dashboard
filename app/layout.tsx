import '@/app/ui/global.css';
import { inter } from './ui/fonts';
import clsx from 'clsx';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  },
  description: 'Dashboard built with App Router.',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx([inter.className, 'antialiased'])}>{children}</body>
    </html>
  );
}
