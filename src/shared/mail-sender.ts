import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import type { Personalization } from "mailersend/lib/modules/Email.module.js";
import { env } from "@/env.js";

export class MailSender {
  public readonly recipients: Recipient[] = [];
  public readonly sender: Sender;

  private readonly mailerSend: MailerSend;
  private readonly email: EmailParams = new EmailParams();

  constructor(sender: Sender) {
    this.mailerSend = new MailerSend({
      apiKey: env.MAILER_SEND_API_KEY,
    });

    this.sender = new Sender(sender.email, sender.name);
    this.email.setFrom(this.sender);
  }

  public getEmail() {
    return this.email;
  }

  public setRecipient(recipient: Recipient) {
    this.recipients.push(new Recipient(recipient.email, recipient.name));
  }

  public setPersonalization(personalizations: Personalization[]) {
    this.email.setPersonalization(personalizations);
  }

  public setSubject(subject: string) {
    this.email.setSubject(subject);
  }

  public setHtml(html: string) {
    this.email.setHtml(html);
  }

  public setTemplateId(id: string) {
    this.email.setTemplateId(id);
  }

  public setTags(tags: string[]) {
    this.email.setTags(tags);
  }

  public async send() {
    this.email.setTo(this.recipients);
    await this.mailerSend.email.send(this.email);
  }
}
