import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";
import { ErrorSerializer, JapiError } from "ts-japi";
import { X_REQUEST_ID_NAME } from "../constants";

@Catch(JapiError)
export class JsonApiExceptionFilter implements ExceptionFilter {
  catch(exception: JapiError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const errorSerializer = new ErrorSerializer({});
    const requestId = response.getHeader(X_REQUEST_ID_NAME);
    exception.id = requestId as string;
    const statusCode = parseInt(exception.status ?? "500", 10);

    response
      .status(statusCode)
      .json(errorSerializer.serialize(exception as any));
  }
}
