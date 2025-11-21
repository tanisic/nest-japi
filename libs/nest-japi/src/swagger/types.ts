import { Type } from "@nestjs/common";
import { JsonApiBaseController } from "../controller/base-controller";
import { Schemas } from "../schema";
import { ResourceOptions } from "../decorators";

export type SwaggerMethodProps = {
  resource: Type<JsonApiBaseController<any, any>>;
  descriptor: PropertyDescriptor;
  schemas: Schemas<any, any, any>;
  resourceOptions: ResourceOptions;
};

export type SwaggerMethodImplementation = (props: SwaggerMethodProps) => void;
