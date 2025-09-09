import { Column,
         CreateDateColumn,
         Entity,
         ManyToOne,
         PrimaryGeneratedColumn,
         JoinColumn
}
from "typeorm";

import {ContractorMail} from "./ContractorMail";

@Entity()
export class Attachment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'uuid', name: 'mail_id' })
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

    @ManyToOne(() => ContractorMail, (mail) => mail.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mail_id' })
    mail: ContractorMail;
}