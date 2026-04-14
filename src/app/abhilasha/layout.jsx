import './style.css';

export const metadata = {
  title: "I'm Sorry...",
  description: "A message for someone special",
};

export default function AbhilashaLayout({ children }) {
  return (
    <div className="abhilasha-namespace">
      {children}
    </div>
  );
}
