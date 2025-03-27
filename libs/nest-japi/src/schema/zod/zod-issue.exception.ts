import { ZodError } from "zod-validation-error";

export class ZodIssuesExeption extends Error {
  error: ZodError;
  constructor(error: ZodError) {
    super(error.message);
    this.error = error;
  }
}
