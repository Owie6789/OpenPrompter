const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace general colors
content = content
  .replace(/bg-slate-50\/50/g, 'bg-canvas')
  .replace(/bg-slate-50/g, 'bg-canvas')
  .replace(/bg-white/g, 'bg-surface')
  .replace(/text-slate-900/g, 'text-ink')
  .replace(/text-slate-800/g, 'text-ink')
  .replace(/text-slate-[67]00/g, 'text-steel')
  .replace(/text-slate-500/g, 'text-steel')
  .replace(/text-[sS]late-[34]00/g, 'text-muted')
  .replace(/border-[sS]late-100/g, 'border-whisper')
  .replace(/border-[sS]late-200/g, 'border-whisper')
  .replace(/border-slate-50\b/g, 'border-whisper')
  .replace(/shadow-sm/g, 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]')
  .replace(/rounded-\[2rem\]/g, 'rounded-[2.5rem]')
  .replace(/rounded-2xl/g, 'rounded-[1.5rem]')
  .replace(/rounded-xl/g, 'rounded-[1rem]')
  .replace(/animate-spin/g, 'skeleton-shimmer h-12 w-full max-w-sm rounded-[1rem] border-none') // spinner to skeletal
  .replace(/<div className="w-16 h-16 rounded-full border-4[^>]*><\/div>\s*<Sparkles[^>]*>/, '<div className="skeleton-shimmer w-full h-[60px] rounded-[1rem]"></div>')
  ;

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App.tsx refined colors.");
