#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program.version('1.0.0', '-v, --version', 'Show version information');
program.command('start', 'Start the bot');
program.command('create-fixture', 'test');

program.parse(process.argv);
