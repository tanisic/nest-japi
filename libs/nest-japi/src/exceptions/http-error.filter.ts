import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { ErrorSerializer, JapiError } from "ts-japi";
import { X_REQUEST_ID_NAME } from "../constants";
import { Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = response.getHeader(X_REQUEST_ID_NAME);
    const errorSerializer = new ErrorSerializer();

    const error = new JapiError({
      id: requestId as string,
      detail: exception.message,
      status: exception.getStatus(),
      code: exception.name,
    });

    response
      .status(exception.getStatus())
      .json(errorSerializer.serialize(error));
  }
}
