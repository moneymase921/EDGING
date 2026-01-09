import './globals.css';
import { UserProvider } from '@/lib/UserContext';

export const metadata = {
  title: 'EV Discipline Machine',
  description: 'Track your pick\'em slips with precision',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
