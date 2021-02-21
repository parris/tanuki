import { Plugin } from 'graphile-build';

import {
  hashIdInputPlugin,
  hashIdOutputPlugin,
  hashIdNodeIdPlugin
} from './fieldPlugin';
import hashIdQueryArgsPlugin from './queryPlugin';

export default [
  hashIdOutputPlugin,
  hashIdInputPlugin,
  hashIdNodeIdPlugin,
  hashIdQueryArgsPlugin,
] as Plugin[];
