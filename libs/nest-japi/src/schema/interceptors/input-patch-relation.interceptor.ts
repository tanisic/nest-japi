import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { CURRENT_SCHEMAS, PARAMS_RELATION_NAME } from "../../constants";
import type { Schemas } from "../types";
import { jsonApiPatchRelationInputSchema, ZodIssuesExeption } from "../zod";
import { errorMap } from "zod-validation-error";

@Injectable()
export class JsonApiInputPatchRelationInterceptor implements NestInterceptor {
  constructor(@Inject(CURRENT_SCHEMAS) private schemas: Schemas) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const schema = this.schemas.schema;
    const req = context.switchToHttp().getRequest<Request>();

    const queryParams = req.params;

    const relName = queryParams[PARAMS_RELATION_NAME];

    if (!relName) {
      throw new BadRequestException("Missing relation name param.");
    }

    const body = req.body;

    const result = await jsonApiPatchRelationInputSchema(
      schema,
      relName,
    ).safeParseAsync(body, {
      errorMap: errorMap,
    });

    if (result.success) {
      req.body = result.data;
    } else {
      throw new ZodIssuesExeption(result.error);
    }

    return next.handle();
  }
}
