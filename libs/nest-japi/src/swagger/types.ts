import { Type } from "@nestjs/common";
import { JsonApiController } from "../controller/base-controller";
import { Schemas } from "../schema";
import { ResourceOptions } from "../decorators/resource.decorator";

export type SwaggerMethodProps = {
  resource: Type<JsonApiController>;
  descriptor: PropertyDescriptor;
  schemas: Schemas<any, any, any>;
  resourceOptions: ResourceOptions;
};

export type SwaggerMethodImplementation = (props: SwaggerMethodProps) => void;
