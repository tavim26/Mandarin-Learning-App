import { Navbar } from '@/components/common/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Toate paginile interioare sunt infasurate in acest layout
// Navbar-ul apare automat fara a fi importat in fiecare pagina
const AppLayout = ({ children }: AppLayoutProps) => {
  return (
     <div className="min-h-screen" style={{ background: '#f8f7f5' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;