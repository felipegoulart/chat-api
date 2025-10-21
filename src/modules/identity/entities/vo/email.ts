import z from "zod";

export const emailSchema = z.email();

export class Email {
  readonly value: string;

  constructor(value: string) {
    this.value = emailSchema.parse(value);
  }

  toString() {
    return this.value.toString();
  }
}
