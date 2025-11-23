import {
  JSONAPI_SCHEMA_ATTRIBUTE_OPTIONS,
  JSONAPI_SCHEMA_ATTRIBUTES,
} from "../constants";
import { type SchemaObject } from "openapi3-ts/oas31";
import { ZodTypeAny } from "zod";
import { JsonApiSchema, InferEntity, ExtractAttributes } from "../schema";

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
  TSchema extends JsonApiSchema<any>,
  AttributeKey extends
    keyof ExtractAttributes<TSchema> = keyof ExtractAttributes<TSchema>,
  Entity extends InferEntity<TSchema> = InferEntity<TSchema>,
  DataKey = keyof Entity,
> = DataKey extends keyof Entity
  ? (value: Entity[DataKey]) => JSONValue
  : AttributeKey extends keyof Entity
    ? (value: Entity[AttributeKey]) => JSONValue
    : (value: unknown) => JSONValue;

export type AttributeOptions<
  TSchema extends JsonApiSchema<any>,
  AttributeKey extends
    keyof ExtractAttributes<TSchema> = keyof ExtractAttributes<TSchema>,
  DataKey extends keyof InferEntity<TSchema> = keyof InferEntity<TSchema>,
> = {
  /**
   * Map this property to another entity attribute.
   *
   * @default property name
   *
   * */
  dataKey?: DataKey extends keyof InferEntity<TSchema>
    ? DataKey
    : keyof InferEntity<TSchema, string>;
  /**
   * Write your openapi docs for this attribute.
   */
  openapi?: Partial<SchemaObject>;
  /**
   * Transform corresponding value from entity to something else.
   * Used in final serialization to response.
   * Works only on view schema, because that schema is reserved for all responses.
   */
  transform?: TransformValue<TSchema, AttributeKey>;
  validate: ZodTypeAny;
};

export type SchemaAttribute<
  TSchema extends JsonApiSchema<any>,
  AttributeKey extends
    keyof ExtractAttributes<TSchema> = keyof ExtractAttributes<TSchema>,
  DataKey extends keyof InferEntity<TSchema> = keyof InferEntity<TSchema>,
> = Required<AttributeOptions<TSchema, AttributeKey, DataKey>> & {
  name: AttributeKey;
};

export function Attribute<
  TSchema extends JsonApiSchema<any>,
  AttributeKey extends
    keyof ExtractAttributes<TSchema> = keyof ExtractAttributes<TSchema>,
  DataKey extends keyof InferEntity<TSchema> = keyof InferEntity<TSchema>,
>(options: AttributeOptions<TSchema, AttributeKey, DataKey>) {
  return (target: TSchema, propertyKey: AttributeKey) => {
    const opts: AttributeOptions<TSchema, AttributeKey, DataKey> = {
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
