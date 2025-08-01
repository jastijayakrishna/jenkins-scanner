import fs from 'node:fs';
import { scan } from '../lib/score';           // ← normal TS import

const text   = fs.readFileSync('./public/demo-complex.Jenkinsfile', 'utf8');
const result = scan(text);

console.log(JSON.stringify(result, null, 2));
