import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { TechStack } from "@/components/sections/TechStack";
import { Experience } from "@/components/sections/Experience";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full overflow-hidden bg-zinc-950 relative">
      <Hero />
      <About />
      <Projects />
      <TechStack />
      <Experience />
      <Contact />
      
      {/* Footer */}
      <footer className="w-full py-8 border-t border-zinc-800/50 bg-zinc-950 flex flex-col md:flex-row items-center justify-between px-6 lg:px-12 z-10 relative">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <span className="text-zinc-950 font-bold font-outfit text-xs">A</span>
          </div>
          <span className="font-outfit font-medium text-sm text-zinc-300">Anand Shukla</span>
        </div>
        <div className="text-zinc-500 text-sm font-light">
          © {new Date().getFullYear()} — Designed & Developed by Anand Shukla.
        </div>
      </footer>
    </main>
  );
}
