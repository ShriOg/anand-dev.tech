import './style.css';

export const metadata = {
  title: 'For Abhilasha',
  description: 'A quiet sanctuary',
};

export default function AbhilashaLayout({ children }) {
  return (
    <div className="abhilasha-root dark font-body text-on-surface midnight-gradient min-h-screen relative flex flex-col overflow-hidden bg-[#0f131e]">
      {/* Material Symbols */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
        rel="stylesheet" 
      />
      <link 
        href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;600&display=swap" 
        rel="stylesheet" 
      />
      {children}
    </div>
  );
}
