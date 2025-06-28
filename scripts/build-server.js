import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        // Read file and replace @shared imports with relative paths
        let content = await fs.readFile(srcPath, 'utf8');
        content = content.replace(/from ["']@shared\/([^"']+)["']/g, 'from "../shared/$1"');
        content = content.replace(/import ["']@shared\/([^"']+)["']/g, 'import "../shared/$1"');
        await fs.writeFile(destPath, content, 'utf8');
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function build() {
  console.log('Building server...');
  
  // Create dist directory
  const distDir = path.join(rootDir, 'dist');
  await fs.mkdir(distDir, { recursive: true });
  
  // Copy server files
  const serverSrc = path.join(rootDir, 'server');
  const serverDest = path.join(distDir, 'server');
  await copyDir(serverSrc, serverDest);
  
  // Copy shared files
  const sharedSrc = path.join(rootDir, 'shared');
  const sharedDest = path.join(distDir, 'shared');
  await copyDir(sharedSrc, sharedDest);
  
  // Copy scripts files
  const scriptsSrc = path.join(rootDir, 'scripts');
  const scriptsDest = path.join(distDir, 'scripts');
  await copyDir(scriptsSrc, scriptsDest);
  
  // Copy package.json
  await fs.copyFile(
    path.join(rootDir, 'package.json'),
    path.join(distDir, 'package.json')
  );
  
  console.log('Server build complete!');
}

build().catch(console.error);