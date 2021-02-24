import { Plugin } from 'graphile-build';

import {
  hashIdInputPlugin,
  hashIdOutputPlugin,
  hashIdNodeIdPlugin
} from './fieldPlugin';
import hashIdQueryArgsPlugin from './queryPlugin';

export const hashIdPlugins = [
  hashIdOutputPlugin,
  hashIdInputPlugin,
  hashIdNodeIdPlugin,
  hashIdQueryArgsPlugin,
] as Plugin[];
