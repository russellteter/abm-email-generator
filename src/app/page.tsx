import { getAccountListItems } from '@/lib/data';
import ClientApp from './ClientApp';

export default async function Home() {
  const accounts = await getAccountListItems();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-class-light-purple bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-class-navy">
            ABM Email Generator
          </h1>
          <p className="mt-1 text-sm text-class-navy/70">
            Generate personalized email sequences for healthcare accounts
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ClientApp accounts={accounts} />
      </main>

      {/* Footer */}
      <footer className="border-t border-class-light-purple bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl text-center text-sm text-class-navy/50">
          Class Technologies ABM Campaign Tool
        </div>
      </footer>
    </div>
  );
}
