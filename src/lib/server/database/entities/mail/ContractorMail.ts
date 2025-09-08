import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, OneToMany, CreateDateColumn, JoinColumn
} from "typeorm";
import {User} from "$lib/server/database";

@Entity()
export class ContractorMail {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    contractor_id: string;

    @Column()
    subject: string;

    @Column()
    sender: string;

    @Column("text") // JSON oder CSV String
    recipients: string;

    @Column("text", { nullable: true })
    body_text?: string;

    @Column("text", { nullable: true })
    body_html?: string;

    @Column({ nullable: true })
    sent_at?: Date;

    @CreateDateColumn()
    created_at: Date;

    @Column({ nullable: true })
    retention_until?: Date;

    @Column({ default: false })
    legal_hold: boolean;

    @Column()
    stored_hash: string;

    @Column({ nullable: true })
    signed_hash?: string;

    @Column({ nullable: true })
    archive_path?: string;

    @Column({ default: "queued" }) // queued | sent | archived | failed
    status: string;

    @OneToMany(() => Attachment, att => att.mail, { cascade: true })
    attachments: Attachment[];

    @OneToMany(() => MailAudit, audit => audit.mail, { cascade: true })
    audits: MailAudit[];

    @ManyToOne(() => User, user => user.roles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}

@Entity()
export class Attachment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    mailId: string;

    @Column()
    filename: string;

    @Column()
    content_type: string;

    @Column()
    size: number;

    @Column()
    storage_path: string;

    @Column()
    sha256: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => ContractorMail, mail => mail.attachments)
    mail: ContractorMail;
}

@Entity()
export class MailAudit {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    mailId: string;

    @Column()
    action: string; // created | updated | archived | retention-changed

    @Column({ nullable: true })
    performedBy?: string;

    @Column("json", { nullable: true })
    meta?: any;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => ContractorMail, mail => mail.audits)
    mail: ContractorMail;
}
