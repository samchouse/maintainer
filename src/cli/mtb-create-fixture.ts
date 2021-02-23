import shell from 'shelljs';
import path from 'path';

shell.exec(`node ${path.resolve(__dirname, '../../bin/commands/create-fixture.js')}`);
