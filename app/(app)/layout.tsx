// app/(main)/layout.tsx
import Navbar from "@/components/Navbar/Navbar";
import Footer from '@/components/Footer/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center">
      
      <div className="w-full max-w-screen-2xl flex flex-col flex-1 bg-white"> 
        
        <Navbar />

        <main className="flex-1 bg-[#f0f4f8]">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}