import {
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMAS,
} from "../constants";
import { InferControllerGenerics, MethodName } from "../controller/types";
import { Injectable, Type } from "@nestjs/common";
import { Schemas } from "../schema/types";
import { snakeCase } from "es-toolkit";
import { JsonBaseController } from "../controller/base-controller";
import { BaseSchema } from "../schema";
import { MetaSchemas, UniqueTuple } from "./types";

export interface ResourceOptions<
  DisabledMethods extends readonly MethodName[] | undefined = undefined,
  ViewSchema extends BaseSchema<any> = BaseSchema<any>,
  CreateSchema extends BaseSchema<any> = ViewSchema,
  UpdateSchema extends BaseSchema<any> = ViewSchema,
> {
  schemas: Schemas<ViewSchema, CreateSchema, UpdateSchema>;
  path?: string;
  disabledMethods?: UniqueTuple<
    DisabledMethods extends MethodName[] ? DisabledMethods : []
  >;
  maxPaginationSize?: number;
  metaSchemas?: MetaSchemas<DisabledMethods>;
}

export const Resource = <
  Resource extends object,
  Generics extends InferControllerGenerics<Resource>,
  DisabledMethods extends readonly MethodName[],
>(
  options: ResourceOptions<
    DisabledMethods,
    Generics["ViewSchema"],
    Generics["CreateSchema"],
    Generics["UpdateSchema"]
  >,
) => {
  return (target: Type<Resource>) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(JsonBaseController, target)) {
      throw new Error(
        `${target.name}: Must extend ${JsonBaseController.name} class to be valid resource.`,
      );
    }

    const opts: ResourceOptions<
      DisabledMethods,
      Generics["ViewSchema"],
      Generics["CreateSchema"],
      Generics["UpdateSchema"]
    > = {
      path: snakeCase(target.name),
      ...options,
    };

    Reflect.defineMetadata(JSONAPI_RESOURCE_SCHEMAS, opts.schemas, target);
    Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, opts, target);
  };
};
