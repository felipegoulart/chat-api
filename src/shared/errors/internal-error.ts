import status from "statuses";

export class InternalError extends Error {
  public readonly codeAsString: string;

  constructor(
    public readonly message: string,
    public readonly code: number = 500,
    public readonly description?: string,
  ) {
    super(message);
    this.codeAsString = status(code);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
