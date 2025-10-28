import status from "statuses";

export class InternalError extends Error {
  public readonly codeAsString: string;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly description?: string,
  ) {
    super(message);
    this.codeAsString = status(statusCode);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
