import { EntityClass, EntityName } from "@mikro-orm/core";
import { JSONAPI_SCHEMA_ENTITY_CLASS, JSONAPI_SCHEMA_TYPE } from "../constants";

export abstract class BaseSchema<Entity = EntityClass<unknown>> {
  get type(): string {
    return Reflect.getMetadata(JSONAPI_SCHEMA_TYPE, this.constructor);
  }

  get entity(): EntityName<Entity> {
    return Reflect.getMetadata(JSONAPI_SCHEMA_ENTITY_CLASS, this.constructor);
  }
}
