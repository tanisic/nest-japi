import { ApiProperty, ApiPropertyOptions } from "@nestjs/swagger";
import {
  JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
} from "../constants";
import { EntityKey } from "@mikro-orm/core";

export interface AttributeOptions<Entity = any> extends ApiPropertyOptions {
  /**
   * Map this property to another entity attribute.
   *
   * @default property name
   *
   * */
  dataKey?: EntityKey<Entity>;
}

export type SchemaAttribute = AttributeOptions & { name: string };

export function Attribute<Entity = any>(
  options: AttributeOptions<Entity>,
): PropertyDecorator {
  return (target, propertyKey) => {
    const opts: AttributeOptions = {
      dataKey: propertyKey as string,
      ...options,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
      opts,
      target,
      propertyKey,
    );

    const restAttributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, target) || [];

    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTES,
      [...restAttributes, { name: propertyKey, ...opts }] as SchemaAttribute[],
      target,
    );

    ApiProperty(opts)(target, propertyKey);
  };
}
