'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlipSnapshot } from '@/lib/types';
import { loadSlips } from '../actions';
import { useUser } from '@/lib/UserContext';
import ReportsClient from './ReportsClient';

export default function ReportsPage() {
  const { username, isLoading } = useUser();
  const router = useRouter();
  const [slips, setSlips] = useState<SlipSnapshot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to login if no username
  useEffect(() => {
    if (!isLoading && !username) {
      router.push('/login');
    }
  }, [username, isLoading, router]);

  // Load slips when username is available
  useEffect(() => {
    if (username) {
      loadSlips(username).then(data => {
        setSlips(data);
        setDataLoading(false);
      });
    }
  }, [username]);

  // Show loading while checking auth
  if (isLoading || dataLoading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  if (!username) {
    return null; // Will redirect
  }

  return <ReportsClient slips={slips} />;
}
