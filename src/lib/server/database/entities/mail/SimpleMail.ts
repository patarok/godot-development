import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from "typeorm";

@Entity()
export class SimpleMail {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    sender: string;

    @Column()
    recipient: string;

    @Column({ nullable: true })
    cc?: string;

    @Column()
    subject: string;

    @Column("text", { nullable: true })
    body_text?: string;

    @Column("text", { nullable: true })
    body_html?: string;

    @Column("text", { nullable: true })
    attachments_list?: string;

    @Column({
        type: "enum",
        enum: ["sent", "error", "received"],
        default: "sent"
    })
    status: "sent" | "error" | "received";

    @Column({ type: "timestamptz", nullable: true })
    sent_at?: Date;

    @CreateDateColumn()
    created_at: Date;
}