import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';
import { Sidebar } from '../components/layout/sidebar';
import { Header } from '../components/layout/header';

export const metadata: Metadata = {
  title: 'ImpactLens | Enterprise Compliance Impact Analysis',
  description:
    'Advanced decision-support platform for evaluating regulatory changes against organization profiles, customs procedures, legal evidence citations, and compliance workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-slate-900 flex min-h-screen selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
