import {
  JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
} from "../constants";
import { type SchemaObject } from "openapi3-ts/oas31";
import { ZodTypeAny } from "zod";
import { BaseSchema, ExtractAttributes, InferEntity } from "../schema";

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

type TransformValue<
  Schema extends BaseSchema<any>,
  AttributeKey extends keyof ExtractAttributes<Schema>,
  Entity extends InferEntity<Schema>,
  DataKey,
> = DataKey extends keyof Entity
  ? (value: Entity[DataKey]) => JSONValue
  : AttributeKey extends keyof Entity
    ? (value: Entity[AttributeKey]) => JSONValue
    : (value: unknown) => JSONValue;

export type AttributeOptions<
  Schema extends BaseSchema<any>,
  AttributeKey extends keyof ExtractAttributes<Schema>,
  DataKey extends keyof InferEntity<Schema> = AttributeKey,
> = {
  /**
   * Map this property to another entity attribute.
   *
   * @default property name
   *
   * */
  dataKey?: DataKey extends keyof InferEntity<Schema>
    ? DataKey
    : keyof InferEntity<Schema>;
  /**
   * Write your openapi docs for this attribute.
   */
  openapi?: Partial<SchemaObject>;
  /**
   * Transform corresponding value from entity to something else.
   * Used in final serialization to response.
   * Works only on view schema, because that schema is reserved for all responses.
   */
  transform?: TransformValue<
    Schema,
    AttributeKey,
    InferEntity<Schema>,
    DataKey
  >;
  validate: ZodTypeAny;
};

export type SchemaAttribute<
  Schema extends BaseSchema<any>,
  AttributeKey extends keyof ExtractAttributes<Schema>,
  DataKey extends keyof InferEntity<Schema> = AttributeKey,
> = Required<AttributeOptions<Schema, AttributeKey, DataKey>> & {
  name: AttributeKey;
};

export function Attribute<
  Schema extends BaseSchema<any>,
  AttributeKey extends keyof ExtractAttributes<Schema>,
  DataKey extends keyof InferEntity<Schema> = AttributeKey,
>(options: AttributeOptions<Schema, AttributeKey, DataKey>) {
  return (target: Schema, propertyKey: AttributeKey) => {
    const opts: AttributeOptions<Schema, AttributeKey, DataKey> = {
      dataKey: propertyKey as any,
      ...options,
    };
    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
      opts,
      target,
      propertyKey as string,
    );

    const restAttributes =
      Reflect.getMetadata(JSONAPI_SCHEMA_ATTRIBUTES, target) || [];

    Reflect.defineMetadata(
      JSONAPI_SCHEMA_ATTRIBUTES,
      [...restAttributes, { name: propertyKey, ...opts }],
      target,
    );
  };
}
