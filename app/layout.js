import './globals.css';

export const metadata = {
  title: 'Laslo League — World Cup 2026',
  description: 'Private World Cup fantasy league',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
