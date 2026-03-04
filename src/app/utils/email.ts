/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import status from "http-status";
import path from "node:path";
import ejs from "ejs";
const transporter = nodemailer.createTransport({
    host: envVars.EMAIL_SENDER.SMTP_HOST,
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    }
});

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer;
        contentType?: string;
    }[];
}

export const sendEmail = async ({ subject, templateName, templateData, to, attachments }: SendEmailOptions) => {
    try {
        const tempalatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);
        const html = await ejs.renderFile(tempalatePath, templateData);
        const info = await transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType
            }))
        });
        console.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error: any) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, `Failed to send email: ${error.message}`);
    }
};