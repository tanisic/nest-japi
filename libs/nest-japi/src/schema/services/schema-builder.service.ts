import { Injectable, Type } from "@nestjs/common";
import { JsonApiSchema } from "../schema";
import { EntityDTO } from "@mikro-orm/core";
import { getAttributes, getRelations } from "../helpers/schema-helper";
import {
  Entity,
  ExtractAttributes,
  ExtractRelations,
  InferEntity,
} from "../types";

export type TransformedItem<TSchema extends JsonApiSchema<any>> = {
  [K in keyof (ExtractAttributes<TSchema> &
    ExtractRelations<TSchema>)]: K extends keyof ExtractAttributes<TSchema>
    ? TSchema[K]
    : K extends keyof ExtractRelations<TSchema>
      ? TSchema[K] extends Array<infer U>
        ? InferEntity<U>[]
        : InferEntity<TSchema[K]>
      : unknown;
};

@Injectable()
export class SchemaBuilderService {
  transformFromDb<
    TSchema extends JsonApiSchema<any>,
    Entity = InferEntity<TSchema>,
  >(
    dbData: EntityDTO<Entity> | EntityDTO<Entity>[] | null,
    schema: Type<TSchema>,
  ): TransformedItem<TSchema> | TransformedItem<TSchema>[] | null {
    if (dbData === null) return null;
    if (Array.isArray(dbData)) {
      return dbData.map((entity) => this.transformSingle(entity, schema));
    } else {
      return this.transformSingle(dbData, schema);
    }
  }

  private transformSingle<
    TSchema extends JsonApiSchema<any>,
    TEntity extends Entity = InferEntity<TSchema>,
  >(dbData: TEntity | EntityDTO<TEntity>, schema: Type<TSchema>) {
    const attributes = getAttributes(schema);
    const relations = getRelations(schema);
    const result = {} as TransformedItem<TSchema>;
    for (const attribute of attributes) {
      if (dbData && attribute.dataKey in dbData) {
        if (attribute.transform) {
          // @ts-expect-error
          result[attribute.name] = attribute.transform(
            // @ts-expect-error
            dbData[attribute.dataKey as keyof typeof dbData],
          );
        } else {
          result[attribute.name as keyof ExtractAttributes<TSchema>] =
            dbData[attribute.dataKey as keyof EntityDTO<Entity>];
        }
      }
    }

    for (const relation of relations) {
      const relSchema = relation.schema() as Type<JsonApiSchema<any>>;
      if (dbData && relation.dataKey! in dbData) {
        //@ts-expect-error
        result[relation.name as keyof ExtractAttributes<TSchema>] =
          this.transformFromDb(
            dbData[relation.dataKey as keyof EntityDTO<Entity>],
            relSchema,
          );
      }
    }
    return result;
  }

  transformToDb<
    TSchema extends JsonApiSchema<any>,
    TEntity extends Entity = InferEntity<TSchema>,
  >(schemaData: Record<string, any>, schema: Type<TSchema>): Entity {
    const attributes = getAttributes(schema);

    return attributes.reduce((result, attribute) => {
      if (attribute.name in schemaData) {
        result[attribute.dataKey! as keyof TEntity] =
          schemaData[attribute.name];
      }
      return result;
    }, {} as TEntity);
  }
}
