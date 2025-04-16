import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../base-schema";
import { EntityDTO } from "@mikro-orm/core";
import { getAttributes, getRelations } from "../helpers/schema-helper";
import { ExtractAttributes, ExtractRelations, InferEntity } from "../types";

export type TransformedItem<Schema extends BaseSchema<any>> =
  ExtractAttributes<Schema> & ExtractRelations<Schema>;

@Injectable()
export class SchemaBuilderService {
  transformFromDb<Schema extends BaseSchema<any>, Entity = InferEntity<Schema>>(
    dbData: EntityDTO<Entity> | EntityDTO<Entity>[] | null,
    schema: Type<Schema>,
  ): TransformedItem<Schema> | TransformedItem<Schema>[] | null {
    if (dbData === null) return null;
    if (Array.isArray(dbData)) {
      return dbData.map((entity) => this.transformSingle(entity, schema));
    } else {
      return this.transformSingle(dbData, schema);
    }
  }

  private transformSingle<
    Schema extends BaseSchema<any>,
    Entity = InferEntity<Schema>,
  >(dbData: EntityDTO<Entity>, schema: Type<Schema>) {
    const attributes = getAttributes(schema);
    const relations = getRelations(schema);
    const result = {} as TransformedItem<Schema>;
    for (const attribute of attributes) {
      if (dbData && attribute.dataKey in dbData) {
        if (attribute.transform) {
          //@ts-expect-error
          result[attribute.name as keyof ExtractAttributes<Schema>] =
            attribute.transform(
              dbData[attribute.dataKey as keyof EntityDTO<Entity>],
            );
        } else {
          //@ts-expect-error
          result[attribute.name as keyof ExtractAttributes<Schema>] =
            dbData[attribute.dataKey as keyof EntityDTO<Entity>];
        }
      }
    }

    for (const relation of relations) {
      const relSchema = relation.schema();
      if (dbData && relation.dataKey in dbData) {
        //@ts-expect-error
        result[relation.name as keyof ExtractAttributes<Schema>] =
          this.transformFromDb(
            //@ts-expect-error
            dbData[relation.dataKey as keyof EntityDTO<Entity>],
            relSchema,
          );
      }
    }
    return result;
  }

  transformToDb<Schema extends BaseSchema<any>, Entity = InferEntity<Schema>>(
    schemaData: Record<string, unknown>,
    schema: Type<Schema>,
  ): EntityDTO<Entity> {
    const attributes = getAttributes(schema);

    return attributes.reduce((result, attribute) => {
      if (attribute.name in schemaData) {
        // @ts-expect-error
        result[attribute.dataKey as keyof EntityDTO<Entity>] =
          schemaData[attribute.name];
      }
      return result;
    }, {} as EntityDTO<Entity>);
  }
}
