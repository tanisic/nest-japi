import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { ErrorSerializer, JapiError } from "ts-japi";
import { X_REQUEST_ID_NAME } from "../constants";
import { Response, Request } from "express";
import { DriverException } from "@mikro-orm/core";

@Catch(DriverException)
export class MikroOrmExceptionFilter implements ExceptionFilter {
  catch(exception: DriverException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request[X_REQUEST_ID_NAME];
    const errorSerializer = new ErrorSerializer();
    const statusCode = 422;

    const error = new JapiError({
      id: requestId as string,
      detail: exception.message,
      title: exception.sqlMessage,
      status: statusCode,
      code: exception.name,
    });

    response.status(statusCode).json(errorSerializer.serialize(error));
  }
}
