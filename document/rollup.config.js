import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default [
	{
		input: 'src/lib.ts',
		output: {
			name: 'tanuki',
			file: 'build/lib.js',
			format: 'umd',
			sourcemap: true
		},
		plugins: [
			typescript(),
			resolve(), // tells Rollup how to find date-fns in node_modules
			commonjs(), // converts date-fns to ES modules
			production && terser(), // minify, but only in production
		]
	},
];
