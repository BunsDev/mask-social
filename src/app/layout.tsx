import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GA } from '../components/GA';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Firefly',
    description: 'WEB3 SOCIAL AGGREGATOR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <GA />
            </body>
        </html>
    );
}
