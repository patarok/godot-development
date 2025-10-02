import type { Actions, PageServerLoad } from './$types';
import { loadSysMail } from '$lib/server/sysmail';
import nodemailer from 'nodemailer';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') return { notAdmin: true } as any;
  const to = url.searchParams.get('to') ?? '';
  return { to };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') return { ok: false, message: 'Forbidden' };
    const form = Object.fromEntries(await request.formData()) as Record<string, string>;
    const to = form.to;
    const subject = form.subject ?? '';
    const text = form.content ?? '';
    const cc = form.cc ?? '';

    const cfg = await loadSysMail();
    const transporter = nodemailer.createTransport({
      host: cfg.smtp.host,
      port: cfg.smtp.port,
      secure: cfg.smtp.secure,
      auth: cfg.smtp.auth ?? undefined
    });

    await transporter.sendMail({
      from: cfg.smtp.from,
      to,
      cc: cc || undefined,
      subject,
      text
    });

    return { ok: true };
  }
};
