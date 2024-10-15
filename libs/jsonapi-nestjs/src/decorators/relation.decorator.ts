import { ApiProperty, ApiPropertyOptions } from "@nestjs/swagger";
import {
  JSONAPI_SCHEMA_RELATION_OPTIONS,
  JSONAPI_SCHEMA_RELATIONS,
} from "../constants";
import { EntityKey } from "@mikro-orm/core";
import { BaseSchema } from "../schema/base-schema";
import { Type } from "@nestjs/common";

export interface RelationOptions<Entity = any> extends ApiPropertyOptions {
  /**
   * Map this property to another entity relation.
   *
   * @default property name
   *
   * */
  dataKey?: EntityKey<Entity>;

  schema: () => Type<BaseSchema<Entity>>;

  many?: boolean;
}

export type RelationAttribute = RelationOptions & { name: string };

export function Relation<Entity = any>(
  options: RelationOptions<Entity>,
): PropertyDecorator {
  return (target, propertyKey) => {
    const opts: RelationOptions = {
      dataKey: propertyKey as string,
      isArray: options.isArray || options.many || false,
      ...options,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_RELATION_OPTIONS,
      opts,
      target,
      propertyKey,
    );

    const restAttributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_RELATIONS, target) || [];

    Reflect.defineMetadata(
      JSONAPI_SCHEMA_RELATIONS,
      [
        ...restAttributes,
        { name: propertyKey, ...opts },
      ] as RelationAttribute[],
      target,
    );

    ApiProperty(opts)(target, propertyKey);
  };
}
