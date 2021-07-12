import MdMap from '../src/index.js';
import * as fs from 'fs';

const md = fs.readFileSync('./demo/test.md', 'utf-8');



MdMap.parse(md.toString());
