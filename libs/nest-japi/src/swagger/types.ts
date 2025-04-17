import { Type } from "@nestjs/common";
import { JsonBaseController } from "../controller/base-controller";
import { Schemas } from "../schema";

export type SwaggerMethodProps = {
  resource: Type<JsonBaseController>;
  descriptor: PropertyDescriptor;
  schemas: Schemas<any, any, any>;
};

export type SwaggerMethodImplementation = (props: SwaggerMethodProps) => void;
