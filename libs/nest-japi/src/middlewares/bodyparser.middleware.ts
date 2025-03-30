import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as express from "express";
import { JSONAPI_CONTENT_TYPE } from "../constants";

@Injectable()
export class JsonApiBodyParserMiddleware implements NestMiddleware {
  private jsonParser = express.json({
    type: ["application/json", JSONAPI_CONTENT_TYPE],
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.jsonParser(req, res, next);
  }
}
