import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JSONAPI_GLOBAL_OPTIONS, X_REQUEST_ID_NAME } from "../constants";
import { type JsonApiModuleOptions } from "../modules";

declare module "express" {
  interface Request {
    [X_REQUEST_ID_NAME]: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(JSONAPI_GLOBAL_OPTIONS)
    private resourceOptions: JsonApiModuleOptions,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (await this.resourceOptions.requestId?.(req, res)) || crypto.randomUUID();
    req[X_REQUEST_ID_NAME] = requestId;
    next();
  }
}
