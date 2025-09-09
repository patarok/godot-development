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

    @Column({ type: 'uuid', name: 'user_id' })
    contractorId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    subject: string;

    @Column({ type: 'varchar', length: 512, nullable: false })
    sender: string;

    @Column({type: "text", nullable: true}) // JSON oder CSV String
    recipients: string;

    @Column("text", { nullable: true })
    bodyText?: string;

    @Column("text", { nullable: true })
    bodyHtml?: string;

    @Column({ type: 'timestamptz', nullable: true })
    sentAt?: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true })
    retentionUntil?: Date;

    @Column({ type: 'boolean', default: false })
    legalHold: boolean;

    @Column({ type: 'varchar', length: 128, nullable: true })
    storedHash: string;

    @Column({ type: 'text', nullable: true })
    signedHash: string;

    @Column({ type: 'varchar', length: 4096, nullable: true })
    archivePath?: string;

    @Column({ type: 'char', length: 8, default: "queued" }) // queued | sent | archived | failed
    status: string;

    @OneToMany(() => Attachment, att => att.mail, { cascade: true })
    attachments: Attachment[];

    @OneToMany(() => MailAudit, audit => audit.mail, { cascade: true })
    audits: MailAudit[];

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}

