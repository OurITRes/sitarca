#!/usr/bin/env node
/* global process */
// Simple dev launcher to run both Vite and the config server in parallel
import { spawn } from 'child_process';

function start(name, cmd, args) {
  const isWin = process.platform === 'win32';
  const p = isWin
    ? spawn([cmd, ...args].join(' '), { stdio: 'inherit', shell: true })
    : spawn(cmd, args, { stdio: 'inherit' });
  p.on('error', (err) => {
    console.error(`[${name}] spawn error:`, err);
    if (cmd === 'npm' || cmd === 'npm.cmd') {
      console.error('[hint] On Windows, ensure npm is available or use npm.cmd');
    }
  });
  p.on('exit', (code) => console.log(`${name} exited with ${code}`));
  return p;
}

const vite = start('vite', 'npm', ['--prefix', 'ui', 'run', 'dev']);
const server = start('server', 'node', ['server/config-server.js']);

process.on('SIGINT', () => { vite.kill(); server.kill(); process.exit(); });
process.on('SIGTERM', () => { vite.kill(); server.kill(); process.exit(); });
