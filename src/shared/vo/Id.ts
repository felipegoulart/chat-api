import { randomUUID } from "node:crypto";
import z from "zod";

export class Id {
  readonly value: string;

  constructor(value?: string) {
    const id = value ? z.uuidv4().parse(value) : randomUUID();
    this.value = id;
  }

  toString() {
    return this.value.toString();
  }
}
