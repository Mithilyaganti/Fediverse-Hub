import { Header } from '@/components/Header';
import { Feed } from '@/components/Feed';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-6">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
