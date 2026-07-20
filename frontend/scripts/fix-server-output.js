import { copyFile, existsSync } from 'node:fs';
import { join } from 'node:path';

const outputServerDir = join(process.cwd(), '.output', 'server');
const source = join(outputServerDir, 'index.mjs');
const target = join(outputServerDir, 'server.js');

if (!existsSync(source)) {
  throw new Error(`Expected build output not found: ${source}`);
}

copyFile(source, target, (error) => {
  if (error) {
    console.error('Failed to copy server bundle:', error);
    process.exit(1);
  }
  console.log(`Created ${target} from ${source}`);
});
