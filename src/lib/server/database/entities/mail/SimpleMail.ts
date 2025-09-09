import { Entity,
         PrimaryGeneratedColumn,
         Column,
         CreateDateColumn
}
from "typeorm";

@Entity()
export class SimpleMail {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("text")
    sender: string;

    @Column("text")
    recipient: string;

    @Column("text", { nullable: true })
    cc?: string;

    @Column("text", { nullable: true })
    subject?: string;

    @Column("text", { nullable: true })
    bodyText?: string;

    @Column("text", { nullable: true })
    bodyHtml?: string;

    @Column("text", { nullable: true })
    attachmentsList?: string;

    @Column({
        type: "enum",
        enum: ["sent", "error", "received"],
        default: "sent"
    })
    status: "sent" | "error" | "received";

    @Column({ type: "timestamptz", nullable: true })
    sentAt?: Date;

    @CreateDateColumn()
    createdAt: Date;
}