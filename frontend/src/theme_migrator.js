import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappings = {
  // Backgrounds (dark to light)
  'bg-slate-950': 'bg-rose-50',
  'bg-slate-900/60': 'bg-white/80',
  'bg-slate-900/50': 'bg-white/70',
  'bg-slate-900/40': 'bg-white/60',
  'bg-slate-900/30': 'bg-white/50',
  'bg-slate-950/80': 'bg-rose-100/80',
  'bg-slate-900': 'bg-white',
  'bg-slate-850': 'bg-rose-50',
  'bg-slate-800': 'bg-rose-100',
  
  // Hover Backgrounds
  'hover:bg-slate-900': 'hover:bg-rose-50',
  'hover:bg-slate-850': 'hover:bg-rose-50',
  'hover:bg-slate-800': 'hover:bg-rose-100',
  'hover:bg-slate-700': 'hover:bg-rose-200',
  
  // Borders
  'border-slate-850': 'border-rose-100',
  'border-slate-800/80': 'border-rose-200/80',
  'border-slate-800': 'border-rose-200',
  'border-slate-700': 'border-rose-300',
  'hover:border-slate-700': 'hover:border-rose-300',
  
  // Texts
  'text-slate-400': 'text-stone-500',
  'text-slate-300': 'text-stone-700',
  'text-slate-200': 'text-stone-800',
  'text-slate-500': 'text-stone-400',
  'text-slate-600': 'text-stone-500',
  
  // Hover Texts
  'hover:text-white': 'hover:text-stone-900',
  
  // Primary color (indigo to rose)
  'indigo-600': 'rose-500',
  'indigo-500': 'rose-400',
  'indigo-400': 'rose-300',
  'indigo-500/10': 'rose-400/10',
  'indigo-500/20': 'rose-400/20',
  'indigo-500/30': 'rose-400/30',
  'ring-indigo-500/30': 'ring-rose-400/30',
  'shadow-indigo-500/10': 'shadow-rose-400/10',
  'shadow-indigo-500/20': 'shadow-rose-400/20',
  'shadow-indigo-600/20': 'shadow-rose-500/20',
  
  // Secondary color (purple to pink)
  'purple-500': 'pink-400',
  'purple-400': 'pink-300',
  'purple-500/10': 'pink-400/10',
  'purple-500/20': 'pink-400/20',
};

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedFiles = 0;

walk(__dirname, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Apply exact mappings
    for (const [key, value] of Object.entries(mappings)) {
      // replace all instances using regex to ensure whole word match if possible, 
      // but some keys have slashes, so use split/join
      content = content.split(key).join(value);
    }
    
    // Replace text-white with text-stone-900 in lines that do NOT have a primary/solid background
    // To be safe, we only replace text-white if it's not on a button. 
    // Usually buttons have bg-rose-400, bg-rose-500, bg-emerald-500, bg-red-500 etc.
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      if (line.includes('text-white')) {
        if (!line.match(/bg-(rose|pink|red|emerald|amber)-[456]00/) && !line.includes('bg-[#0b0f19]')) {
          return line.split('text-white').join('text-stone-900');
        }
      }
      return line;
    });
    content = newLines.join('\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      changedFiles++;
    }
  }
});

console.log(`Updated ${changedFiles} files.`);
