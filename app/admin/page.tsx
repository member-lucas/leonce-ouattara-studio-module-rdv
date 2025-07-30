'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers le dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00F5FF]/30 rounded-full animate-spin mb-4 mx-auto">
          <div className="absolute inset-0 border-4 border-transparent border-t-[#00F5FF] rounded-full animate-spin"></div>
        </div>
        <p className="text-white">Redirection vers le dashboard...</p>
      </div>
    </div>
  );
}