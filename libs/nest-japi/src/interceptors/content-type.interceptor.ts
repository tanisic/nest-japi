import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { JSONAPI_CONTENT_TYPE } from "../constants";
import { JapiError } from "ts-japi";

@Injectable()
export class JsonApiContentTypeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    const contentType = request.headers["content-type"];

    if (contentType !== JSONAPI_CONTENT_TYPE) {
      throw new JapiError({
        status: "400",
        detail: `Invalid content type. Expected ${JSONAPI_CONTENT_TYPE}`,
        source: {
          header: "Content-Type",
        },
      });
    }

    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader("content-type", JSONAPI_CONTENT_TYPE);

    return next.handle();
  }
}
