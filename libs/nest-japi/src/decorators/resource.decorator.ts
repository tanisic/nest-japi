import {
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { MethodName } from "../controller/types";
import { Injectable } from "@nestjs/common";
import { Schemas } from "../schema/types";
import { snakeCase } from "es-toolkit";
import { JsonBaseController } from "../controller/base-controller";
import { BaseSchema } from "../schema";

export interface ResourceOptions<
  ViewSchema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> {
  schemas: Schemas<ViewSchema, CreateSchema, UpdateSchema>;
  path?: string;
  disabledMethods?: ReadonlyArray<MethodName>;
  maxPaginationSize?: number;
}

export const Resource = <
  ViewSchema extends BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
>(
  options: ResourceOptions<ViewSchema, CreateSchema, UpdateSchema>,
) => {
  return (target: Function) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(JsonBaseController, target)) {
      throw new Error(
        `${target.name}: Must extend ${JsonBaseController.name} class to be valid resource.`,
      );
    }

    const opts: ResourceOptions<ViewSchema, CreateSchema, UpdateSchema> = {
      path: snakeCase(target.name),
      ...options,
    };

    Reflect.defineMetadata(JSONAPI_RESOURCE_SCHEMAS, opts.schemas, target);
    Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, opts, target);
  };
};
