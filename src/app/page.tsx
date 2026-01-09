'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

export default function Home() {
  const { username, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (username) {
        router.replace('/two');
      } else {
        router.replace('/login');
      }
    }
  }, [username, isLoading, router]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </main>
  );
}
