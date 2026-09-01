import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0B6B3A] dark:focus:ring-emerald-500 overflow-hidden"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            scale: theme === 'dark' ? 0 : 1,
            opacity: theme === 'dark' ? 0 : 1,
            rotate: theme === 'dark' ? 90 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Sun className="w-5 h-5 text-amber-500" />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            scale: theme === 'light' ? 0 : 1,
            opacity: theme === 'light' ? 0 : 1,
            rotate: theme === 'light' ? -90 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Moon className="w-5 h-5 text-emerald-400" />
        </motion.div>
      </div>
    </button>
  );
}
