#!/usr/bin/env node
/* global process */
// Simple dev launcher to run both Vite and the config server in parallel
import { spawn } from 'child_process';

function start(name, cmd, args) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  p.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on('data', d => process.stderr.write(`[${name}] ${d}`));
  p.on('exit', (code) => console.log(`${name} exited with ${code}`));
  return p;
}

const vite = start('vite', 'npm', ['run', 'dev']);
const server = start('server', 'node', ['server/config-server.js']);

process.on('SIGINT', () => { vite.kill(); server.kill(); process.exit(); });
process.on('SIGTERM', () => { vite.kill(); server.kill(); process.exit(); });
