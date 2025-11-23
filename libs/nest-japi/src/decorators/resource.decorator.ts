import {
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { MethodName } from "../controller/types";
import { Injectable, PipeTransform } from "@nestjs/common";
import { Schemas } from "../schema/types";
import { JsonApiController } from "../controller/base-controller";
import { MetaSchemas, UniqueTuple } from "./types";
import { snakeCase } from "../helpers";

export interface ResourceOptions<
  DisabledMethods extends readonly MethodName[] | undefined = undefined,
  TSchemas extends Schemas<any, any, any> = Schemas<any, any, any>,
> {
  schemas: TSchemas;
  path?: string;
  disabledMethods?: UniqueTuple<
    DisabledMethods extends MethodName[] ? DisabledMethods : []
  >;
  maxPaginationSize?: number;
  metaSchemas?: MetaSchemas<DisabledMethods>;
  idParamPipe?: PipeTransform | Function;
}

export const Resource = (options: ResourceOptions) => {
  return (target: any) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(JsonApiController, target)) {
      throw new Error(
        `${target.name}: Must extend ${JsonApiController.name} class to be valid resource.`,
      );
    }

    const opts: ResourceOptions = {
      path: snakeCase(target.name),
      ...options,
    };

    Reflect.defineMetadata(JSONAPI_RESOURCE_SCHEMAS, opts.schemas, target);
    Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, opts, target);
  };
};
