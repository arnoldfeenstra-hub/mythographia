// Applies db/schema.sql over Neon's HTTPS driver (works where port 5432 is closed).
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { databaseUrl } from '../lib/env.js';

const sql = neon(databaseUrl());
const statements = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
  .replace(/--.*$/gm, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log(`schema applied (${statements.length} statements)`);
