import { Entity,
         PrimaryGeneratedColumn,
         Column,
         ManyToOne,
         OneToMany,
         CreateDateColumn,
         JoinColumn
}
from "typeorm";

import {User} from '$lib/server/database/entities';

import { Attachment } from './Attachment';
import { MailAudit } from './MailAudit';

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

    @Column({ type: 'timestamptz', nullable: true })
    sent_at?: Date;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
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

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}

