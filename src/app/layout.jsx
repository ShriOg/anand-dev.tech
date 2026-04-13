import "./globals.css";

export const metadata = {
  title: "Anand | Building Systems",
  description: "Portfolio of Anand - Building Systems. Not Just Websites.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
