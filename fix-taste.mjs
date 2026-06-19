import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace general colors
content = content
  .replace(/bg-slate-50\/[0-9]+/g, 'bg-canvas')
  .replace(/bg-slate-50/g, 'bg-canvas')
  .replace(/bg-white\/[0-9]+/g, 'bg-surface')
  .replace(/bg-white/g, 'bg-surface')
  .replace(/text-slate-[89]00/g, 'text-ink')
  .replace(/text-slate-[67]00/g, 'text-steel')
  .replace(/text-slate-500/g, 'text-steel')
  .replace(/text-[sS]late-[34]00/g, 'text-muted')
  .replace(/border-[sS]late-[12]00/g, 'border-whisper')
  .replace(/border-slate-50\b/g, 'border-whisper')
  .replace(/shadow-sm/g, 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]')
  .replace(/rounded-\[2rem\]/g, 'rounded-[2.5rem]')
  .replace(/rounded-2xl/g, 'rounded-[1.5rem]')
  .replace(/rounded-xl/g, 'rounded-[1rem]')
  .replace(/bg-slate-900(?=\s|")/g, 'bg-accent text-white')
  .replace(/hover:bg-slate-800/g, 'hover:bg-accent-hover')
  .replace(/text-violet-600/g, 'text-accent hover:text-accent-hover')
  .replace(/text-violet-500/g, 'text-accent hover:text-accent-hover')
  .replace(/text-rose-500/g, 'text-error hover:text-error')
  .replace(/text-rose-600/g, 'text-error')
  // Loaders
  .replace(/w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin/g, 'skeleton-shimmer w-full h-[60px] rounded-[1rem]')
  // Remove spinner icon wrapping logic if it interferes with Shimmer
  .replace(/<div className="relative">\s*<div className="skeleton-shimmer[^>]*><\/div>\s*<Sparkles[^>]*>\s*<\/div>/g, '<div className="skeleton-shimmer w-full max-w-[200px] h-[60px] rounded-[1rem]"></div>')
  ;

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App.tsx refined colors.");
