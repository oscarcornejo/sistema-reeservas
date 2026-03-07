/**
 * @fileoverview Root layout de TurnoPro.
 * Configura fuentes (Geist), theme provider (next-themes), y Toaster global.
 */

import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        default: 'TurnoPro — Gestión de citas profesional',
        template: '%s | TurnoPro',
    },
    description:
        'Plataforma de reservas y gestión de citas para barberías, spas, clínicas y negocios de servicio en Latinoamérica.',
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f9f9fa' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
    ],
    colorScheme: 'light dark',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster richColors position="top-right" closeButton duration={4000} />
                </ThemeProvider>
            </body>
        </html>
    );
}
