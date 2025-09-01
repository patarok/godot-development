import fs from 'fs/promises';
import path from 'path';

export type SysMailConfig = {
  smtp: { host: string; port: number; secure: boolean; auth?: { user: string; pass: string } | null; from: string };
  // For future: imap/pop settings
  imap?: { host: string; port: number; secure: boolean; user?: string; pass?: string };
  pop3?: { host: string; port: number; secure: boolean; user?: string; pass?: string };
};

const ROOT = process.cwd();
const SYSMAIL_FILE = path.join(ROOT, 'sysmail.json');

export async function loadSysMail(): Promise<SysMailConfig> {
  try {
    const raw = await fs.readFile(SYSMAIL_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // default to Mailhog
    return {
      smtp: { host: 'mail', port: 1025, secure: false, auth: null, from: 'system@example.local' },
      imap: { host: 'imap.bplaced.net', port: 993, secure: true },
      pop3: { host: 'pop.bplaced.net', port: 995, secure: true }
    };
  }
}
