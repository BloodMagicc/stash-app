import "./globals.css";

export const metadata = {
  title: "STASH - Zero-Knowledge Net Worth Tracker",
  description: "E2EE financial tracking app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
