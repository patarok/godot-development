import { AppDataSource } from "$lib/server/database";
import { Mail } from "../db/entities/Mail";
import { getTransporter } from "./mailTransporter";
import type { Transporter } from "nodemailer";

/**
 * Holt pending Mails aus der DB und versucht sie zu versenden.
 * Fehlerhafte Mails werden auf status=error gesetzt und können erneut verschickt werden.
 */
export async function sendPendingMails(limit = 10) {
    const repo = AppDataSource.getRepository(Mail);

    const mails = await repo.find({
        where: { status: "pending" },
        take: limit,
        order: { createdAt: "ASC" },
    });

    const transporter: Transporter = getTransporter();

    for (const mail of mails) {
        try {
            const attachments = mail.attachments
                ? Array.isArray(mail.attachments)
                    ? mail.attachments
                    : JSON.parse(mail.attachments as unknown as string)
                : undefined;

            await transporter.sendMail({
                from: mail.sender ?? process.env.SMTP_FROM ?? "no-reply@example.com",
                to: mail.recipient,
                cc: mail.cc || undefined,
                subject: mail.subject,
                text: mail.bodyText || undefined,
                html: mail.bodyHtml || undefined,
                attachments,
            });

            mail.status = "sent";
            mail.sentAt = new Date();
            await repo.save(mail);

            if (mail.category === "business") {
                // TODO: Archivierung (Delegation an mailService.createContractorMail)
            }
        } catch (err: any) {
            console.error("Error sending mail:", err);

            mail.status = "error";
            mail.lastError = err.message;
            mail.attempts++;
            await repo.save(mail);
        }
    }
}

/**
 * Direktmail (z. B. für Ad-hoc Benachrichtigungen)
 */
export async function sendMail(
    to: string,
    subject?: string,
    text?: string,
    cc?: string
) {
    const transporter: Transporter = getTransporter();

    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "no-reply@example.com",
        to,
        cc: cc || undefined,
        subject: subject ?? "",
        text: text ?? "",
    });

    return { ok: true };
}
