import { Column,
         CreateDateColumn,
         Entity,
         ManyToOne,
         PrimaryGeneratedColumn,
         JoinColumn
}
from "typeorm";

import { ContractorMail } from "./ContractorMail";

@Entity()
export class MailAudit {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'uuid', name: 'mail_id' })
    mailId: string;

    @Column({ type: 'char', length: 18})
    action: string; // created | updated | archived | retention-changed // maybe a new type.. taking 18 chars seems safe still which is 1 more than the longest

    @Column({ type: 'text', nullable: true })
    performedBy?: string;

    @Column("json", { nullable: true })
    meta?: any;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => ContractorMail, (mail) => mail.audits, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mail_id' })
    mail: ContractorMail;
}
