export class ApplicationError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
  }
}
