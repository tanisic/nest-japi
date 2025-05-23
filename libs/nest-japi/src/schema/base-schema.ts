import { EntityClass } from "@mikro-orm/core";
import { JSONAPI_SCHEMA_ENTITY_CLASS, JSONAPI_SCHEMA_TYPE } from "../constants";

export abstract class BaseSchema<Entity = EntityClass<unknown>> {
  id!: string | number;

  get type(): string {
    return Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, this.constructor);
  }

  get entity(): EntityClass<Entity> {
    return Reflect.getMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, this.constructor);
  }
}
