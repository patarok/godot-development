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

    @Column()
    action: string; // created | updated | archived | retention-changed

    @Column({ nullable: true })
    performedBy?: string;

    @Column("json", { nullable: true })
    meta?: any;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => ContractorMail, (mail) => mail.audits, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mail_id' })
    mail: ContractorMail;
}
