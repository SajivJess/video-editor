const fs = require('node:fs');
const path = require('node:path');

function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function inside(base, file) {
  const relative = path.relative(base, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
function localFile(base, filename, extensions) {
  if (typeof filename !== 'string' || !filename || path.basename(filename) !== filename || /[\\/]/.test(filename)) fail('Invalid filename');
  const file = path.resolve(base, filename);
  if (!extensions.includes(path.extname(file).toLowerCase())) fail('Unsupported file type');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) fail('File not found', 404);
  if (!inside(fs.realpathSync(base), fs.realpathSync(file))) fail('File is outside the workspace');
  return file;
}
function sourceVideo(root, publicVideoDir, value) {
  if (typeof value !== 'string' || !value) fail('Select or upload a presenter video');
  const file = path.resolve(root, value);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) fail('Source video not found', 404);
  const actual = fs.realpathSync(file);
  const bases = [path.join(root, 'Input'), publicVideoDir].filter(dir => fs.existsSync(dir));
  if (!bases.some(dir => inside(fs.realpathSync(dir), actual))) fail('Choose a video from Input or public/video');
  if (!['.mp4', '.mov', '.webm'].includes(path.extname(actual).toLowerCase())) fail('Unsupported video type');
  return actual;
}
module.exports = { fail, inside, localFile, sourceVideo };
