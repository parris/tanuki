import { execSync } from 'child_process';
import * as path from 'path';
import * as minimist from 'minimist';

let args: any = minimist(process.argv.slice(2));

let today = (new Date()).toISOString().replace('T', '').replace('Z', '').replace(/-/g, '').replace(/:/g, '').replace('.', '');
today = today.substring(0, today.length - 7);
const random = Math.floor(1000 + (Math.random() * 9000));

const fileName = `${today}${random}_${args._[0]}.ts`;
const destination = path.join(process.cwd(), 'src', 'migrations', fileName);
const source = path.join(__dirname, 'templates', 'migration.ts');

execSync(`cp ${source} ${destination}`);
