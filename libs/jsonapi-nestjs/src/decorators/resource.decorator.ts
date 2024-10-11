import { snakeCase } from "es-toolkit";
import {
  JSONAPI_RESOURCE_ENTITY_CLASS,
  JSONAPI_RESOURCE_OPTIONS,
  JSONAPI_RESOURCE_SCHEMA,
  JSONAPI_RESOURCE_TYPE,
} from "../constants";
import { BaseResource } from "../resource/base-resource";
import { MethodName } from "../controller/types";
import { EntityName } from "@mikro-orm/core";
import { z } from "zod";
import { Injectable } from "@nestjs/common";

export interface ResourceOptions {
  dbEntity: EntityName<unknown>;
  validationSchema: z.AnyZodObject;
  jsonapiType?: string;
  path?: string;
  disabledMethods?: MethodName[];
}

export const Resource = (options: ResourceOptions): ClassDecorator => {
  return (target: Function) => {
    Injectable()(target);
    if (!Object.prototype.isPrototypeOf.call(BaseResource, target)) {
      throw new Error(
        `${target.name}: Must extend ${BaseResource.name} class to be valid resource.`,
      );
    }

    Reflect.defineMetadata(
      JSONAPI_RESOURCE_TYPE,
      options?.jsonapiType || snakeCase(target.name),
      target,
    );

    Reflect.defineMetadata(
      JSONAPI_RESOURCE_ENTITY_CLASS,
      options.dbEntity,
      target,
    );

    Reflect.defineMetadata(
      JSONAPI_RESOURCE_SCHEMA,
      options.validationSchema,
      target,
    );

    if (options) {
      Reflect.defineMetadata(JSONAPI_RESOURCE_OPTIONS, options, target);
    }
  };
};
