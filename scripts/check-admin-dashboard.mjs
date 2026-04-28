import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminDir = path.join(rootDir, 'apps', 'admin-dashboard');
const indexPath = path.join(adminDir, 'index.html');
const appPath = path.join(adminDir, 'app.js');

for (const filePath of [indexPath, appPath, path.join(adminDir, 'styles.css')]) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing admin dashboard file: ${path.relative(rootDir, filePath)}`);
  }
}

execFileSync(process.execPath, ['--check', appPath], { stdio: 'inherit' });

const html = readFileSync(indexPath, 'utf8');
const localReferences = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((reference) => !/^(?:https?:|data:|mailto:|tel:|#)/.test(reference));

for (const reference of localReferences) {
  const [pathname] = reference.split(/[?#]/);
  const targetPath = path.resolve(adminDir, pathname);

  if (!targetPath.startsWith(`${adminDir}${path.sep}`) || !existsSync(targetPath)) {
    throw new Error(`Broken admin dashboard asset reference: ${reference}`);
  }
}

console.log(`Admin dashboard check passed (${localReferences.length} local asset references).`);
