'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

function POSLoadingShell() {
  return (
    <div className="min-h-screen bg-[#0C3B2E] text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-1 border-2 border-amber-400 bg-gradient-to-br from-amber-400/30 to-emerald-950/80 animate-pulse">
          <Image
            src="/icon.svg"
            alt="ដេប៉ូ សំណាង បូរិន"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-amber-400 tracking-tight">
            ដេប៉ូ សំណាង បូរិន
          </h1>
          <p className="text-xs text-emerald-200/80 mt-1 font-medium">
            samnang borin shop · កំពុងដំណើរការ POS...
          </p>
        </div>
        <div className="w-48 h-1.5 bg-emerald-950/80 rounded-full overflow-hidden mt-2 border border-emerald-800/50">
          <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

const POSApp = dynamic(() => import('@/components/POSApp'), {
  ssr: false,
  loading: () => <POSLoadingShell />,
});

export default function Home() {
  return <POSApp />;
}
