import globby from 'globby';
import fs from 'fs-extra';
import path from 'path';
import reactDocgen from 'react-docgen';
import crypto from 'crypto';

function hashComponent(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function guessType(name = '') {
  const key = name.toLowerCase();
  if (key.includes('button')) return 'Button';
  if (key.includes('input') || key.includes('field')) return 'Input';
  if (key.includes('card')) return 'Card';
  if (key.includes('modal')) return 'Modal';
  return 'Other';
}

export async function scanComponents(rootDir) {
  const files = await globby(['**/*.{js,jsx,ts,tsx}'], { cwd: rootDir, absolute: true });
  const components = [];
  const seenHashes = new Map();

  for (const file of files) {
    try {
      const code = await fs.readFile(file, 'utf8');
      const parsed = reactDocgen.parse(code);
      const hash = hashComponent(JSON.stringify(parsed.props || {}));

      const component = {
        name: parsed.displayName || path.basename(file),
        type: guessType(parsed.displayName || file),
        path: file.replace(rootDir, ''),
        props: Object.keys(parsed.props || {}),
        isDuplicate: seenHashes.has(hash),
      };

      seenHashes.set(hash, true);
      components.push(component);
    } catch {
      // skip
    }
  }

  return components;
}