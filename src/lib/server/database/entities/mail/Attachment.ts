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

    @Column({ type: 'varchar', length: 256 })
    title: string;

    @Column({ type: 'varchar', length: 127, nullable: true })
    contentType: string;

    @Column({ type: 'int', nullable: true })
    size: number;

    @Column({ type: 'varchar', length: 4096, nullable: false })
    storagePath: string;

    @Column({ type: 'char', length: 64, nullable: true })
    sha256Hash: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => ContractorMail, (mail) => mail.attachments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mail_id' })
    mail: ContractorMail;
}