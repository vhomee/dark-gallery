import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dark Gallery',
  description: 'A minimalist 3D photography portfolio',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 🔴 核心修复：
        1. 直接在 body 上写 style="background-color: #000"
        2. 加上 className="bg-black" 双重保险
      */}
      <body 
        className={`${inter.className} bg-black`} 
        style={{ backgroundColor: '#000000', color: '#ffffff', margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  );
}