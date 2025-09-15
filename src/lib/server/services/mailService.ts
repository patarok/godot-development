import { randomBytes, createHash } from 'crypto';
import { AppDataSource } from '$lib/server/database';
import { Mail } from "../db/entities/Mail";
import { ContractorMail, Attachment, MailAudit } from "../db/entities/ContractorMail";

type CreateMailInput = {
    type: "templateMail" | "readyMail";
    category: "system" | "business";
    sender: string;
    recipient: string;
    cc?: string;
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    templatePayload?: Record<string, any>;
    attachments?: { filename: string; path: string }[];
};

type CreateContractorMailInput = {
    contractorId: string;
    sender: string;
    recipients: string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    attachments?: {
        filename: string;
        contentType: string;
        size: number;
        storagePath: string;
        sha256: string;
    }[];
    retentionUntil?: Date;
    legalHold?: boolean;
};

/**
 * Normale Mail in Queue speichern (z. B. Systemmails).
 */
export async function createMail(input: CreateMailInput) {
    const repo = AppDataSource.getRepository(Mail);

    const mail = repo.create({
        ...input,
        status: "pending",
        attempts: 0,
    });

    return await repo.save(mail);
}

/**
 * ContractorMail erstellen + archivieren (aber nicht senden).
 */
export async function createContractorMail(input: CreateContractorMailInput) {
    const repo = AppDataSource.getRepository(ContractorMail);
    const attRepo = AppDataSource.getRepository(Attachment);
    const auditRepo = AppDataSource.getRepository(MailAudit);

    const mail = repo.create({
        contractor_id: input.contractorId,
        sender: input.sender,
        recipients: JSON.stringify(input.recipients),
        subject: input.subject,
        body_text: input.bodyText,
        body_html: input.bodyHtml,
        status: "archived", // direkt als archiviert markieren
        retention_until: input.retentionUntil,
        legal_hold: input.legalHold ?? false,
        stored_hash: "", // wird gleich gesetzt
    });

    // speichern, damit wir eine ID haben
    await repo.save(mail);

    // Attachments anlegen
    if (input.attachments?.length) {
        for (const a of input.attachments) {
            const att = attRepo.create({
                mail,
                mailId: mail.id,
                filename: a.filename,
                content_type: a.contentType,
                size: a.size,
                storage_path: a.storagePath,
                sha256: a.sha256,
            });
            await attRepo.save(att);
        }
    }

    // Hash über "canonical" Mail erzeugen
    const canonical = [
        `From: ${input.sender}`,
        `To: ${input.recipients.join(", ")}`,
        `Subject: ${input.subject}`,
        `Date: ${new Date().toISOString()}`,
        "",
        input.bodyText || input.bodyHtml || ""
    ].join("\n");

    const messageHash = createHash("sha256").update(canonical).digest("hex");
    mail.stored_hash = messageHash;

    await repo.save(mail);

    // Audit-Eintrag
    const audit = auditRepo.create({
        mail,
        mailId: mail.id,
        action: "created",
        performedBy: "system",
        meta: {
            attachments: input.attachments?.map(a => ({
                filename: a.filename,
                sha256: a.sha256,
            })),
        },
    });
    await auditRepo.save(audit);

    return mail;
}
