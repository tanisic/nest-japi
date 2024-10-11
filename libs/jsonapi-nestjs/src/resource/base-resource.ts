import { Get } from "@nestjs/common";
import {
  JSONAPI_RESOURCE_ENTITY_CLASS,
  JSONAPI_RESOURCE_SCHEMA,
  JSONAPI_RESOURCE_TYPE,
} from "../constants";
import { EntityName } from "@mikro-orm/core";
import { z } from "zod";

export abstract class BaseResource<
  DbEntity = any,
  ValidationSchema extends z.SomeZodObject = any,
> {
  get type(): string {
    return Reflect.getMetadata(JSONAPI_RESOURCE_TYPE, this.constructor);
  }

  get entity(): EntityName<DbEntity> {
    return Reflect.getMetadata(JSONAPI_RESOURCE_ENTITY_CLASS, this.constructor);
  }

  get schema(): ValidationSchema {
    return Reflect.getMetadata(JSONAPI_RESOURCE_SCHEMA, this.constructor);
  }

  @Get()
  getOne() {
    // return this[JSONAPI_RESOURCE_TYPE];
    return this.type;
  }
}
