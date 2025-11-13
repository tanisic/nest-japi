import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { ErrorSerializer, JapiError } from "ts-japi";
import { X_REQUEST_ID_NAME } from "../constants";
import { Response, Request } from "express";
import { ZodIssuesExeption } from "../schema/zod/zod-issue.exception";

@Catch(ZodIssuesExeption)
export class ZodIssuesExceptionFilter implements ExceptionFilter {
  catch(exception: ZodIssuesExeption, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request[X_REQUEST_ID_NAME];
    const errorSerializer = new ErrorSerializer();

    const errors = exception.error.errors.map((error) => {
      const source = `/${error.path.join("/")}`;
      return new JapiError({
        status: 422,
        source: { pointer: source },
        detail: error.message,
        code: error.code,
        id: requestId as string,
      });
    });

    response.status(422).json(errorSerializer.serialize(errors));
  }
}
