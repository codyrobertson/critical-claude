import path from 'path';

console.log('Current working directory:', process.cwd());
console.log('Resolving "test-file.json":', path.resolve('test-file.json'));
console.log('Resolving "./test-file.json":', path.resolve('./test-file.json'));
console.log('Resolving "results/test-file.json":', path.resolve('results/test-file.json'));