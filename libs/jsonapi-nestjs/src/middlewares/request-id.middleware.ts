import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { X_REQUEST_ID_NAME } from "../constants";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers[X_REQUEST_ID_NAME] || uuidv4();

    req.headers[X_REQUEST_ID_NAME] = requestId;

    res.setHeader(X_REQUEST_ID_NAME, requestId);

    next();
  }
}
