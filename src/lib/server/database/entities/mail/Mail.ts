import { Entity,
         PrimaryGeneratedColumn,
         Column,
         CreateDateColumn,
         UpdateDateColumn
}
from "typeorm";

export type MailStatus = "pending" | "sent" | "error";
export type MailType = "templateMail" | "readyMail";
export type MailCategory = "system" | "business";

@Entity("mails")
export class Mail {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar" })
    type!: MailType; // templateMail | readyMail

    @Column({ type: "varchar" })
    category!: MailCategory; // system | business

    @Column({ type: "varchar" })
    sender!: string;

    @Column({ type: "varchar" })
    recipient!: string;

    @Column({ type: "varchar", nullable: true })
    cc?: string;

    @Column({ type: "varchar" })
    subject!: string;

    @Column({ type: "text", nullable: true })
    bodyText?: string;

    @Column({ type: "text", nullable: true })
    bodyHtml?: string;

    @Column({ type: "json", nullable: true })
    templatePayload?: Record<string, any>;

    @Column({ type: "json", nullable: true })
    attachments?: { filename: string; path: string }[];

    @Column({ type: "varchar", default: "pending" })
    status!: MailStatus;

    @Column({ type: "int", default: 0 })
    attempts!: number;

    @Column({ type: "text", nullable: true })
    lastError?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ type: "timestamp", nullable: true })
    sentAt?: Date;
}
