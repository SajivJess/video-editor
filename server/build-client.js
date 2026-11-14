const esbuild = require('esbuild');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const entry = path.join(ROOT, 'dashboard', 'src', 'App.tsx');
const outfile = path.join(ROOT, 'server', 'public', 'app.js');

async function build() {
  console.log('Building React Dashboard with esbuild...');
  try {
    await esbuild.build({
      entryPoints: [entry],
      outfile: outfile,
      bundle: true,
      minify: process.env.NODE_ENV === 'production',
      sourcemap: true,
      target: ['es2020'],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
    });
    console.log('✅ Dashboard React bundle compiled successfully to server/public/app.js');
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();

