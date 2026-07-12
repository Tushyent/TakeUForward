/**
 * prodSafety.test.js
 *
 * Verifies that the POST /api/auth/test-session route
 * is completely removed from the Express router when NODE_ENV=production.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Production Safety Tests', () => {
  it('should not register the POST /api/auth/test-session route in production', () => {
    // Because Node ESM caches modules globally and jest.resetModules() does not clear ESM imports,
    // we use a quick child process to evaluate the file strictly in production mode.
    
    const script = `
      import express from 'express';
      import authRoutes from './routes/authRoutes.js';
      
      const app = express();
      app.use('/api/auth', authRoutes);
      
      // Look through the registered routes on the authRoutes router
      const routes = authRoutes.stack
        .filter(r => r.route)
        .map(r => ({ path: r.route.path, methods: r.route.methods }));
        
      const hasTestSession = routes.some(r => r.path === '/test-session' && r.methods.post);
      
      if (hasTestSession) {
        process.stderr.write('FAIL: /test-session route is registered in production!\\n');
        process.exit(1);
      } else {
        process.stdout.write('PASS: Route absent\\n');
        process.exit(0);
      }
    `;

    // Write the temp script and execute it
    const tempFile = path.join(__dirname, '../temp_prod_test.js');
    fs.writeFileSync(tempFile, script);

    try {
      const output = execSync(`node ${tempFile}`, {
        env: { ...process.env, NODE_ENV: 'production', ALLOW_TEST_SESSION: 'true' },
        encoding: 'utf-8'
      });
      expect(output).toContain('PASS: Route absent');
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('should not register the route in development if ALLOW_TEST_SESSION is unset', () => {
    const script = `
      import express from 'express';
      import authRoutes from './routes/authRoutes.js';
      
      const app = express();
      app.use('/api/auth', authRoutes);
      
      const routes = authRoutes.stack
        .filter(r => r.route)
        .map(r => ({ path: r.route.path, methods: r.route.methods }));
        
      const hasTestSession = routes.some(r => r.path === '/test-session' && r.methods.post);
      
      if (hasTestSession) {
        process.stderr.write('FAIL: /test-session route is registered!\\n');
        process.exit(1);
      } else {
        process.stdout.write('PASS: Route absent\\n');
        process.exit(0);
      }
    `;

    const tempFile = path.join(__dirname, '../temp_dev_test.js');
    fs.writeFileSync(tempFile, script);

    try {
      const output = execSync(`node ${tempFile}`, {
        env: { ...process.env, NODE_ENV: 'development', ALLOW_TEST_SESSION: 'false' },
        encoding: 'utf-8'
      });
      expect(output).toContain('PASS: Route absent');
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });
});
