import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../base-schema";
import { EntityDTO } from "@mikro-orm/core";
import { getAttributes, getRelations } from "../helpers/schema-helper";

@Injectable()
export class SchemaBuilderService {
  transformFromDb<Entity>(
    dbData: EntityDTO<Entity> | EntityDTO<Entity>[] | null,
    schema: Type<BaseSchema<any>>,
  ): EntityDTO<Entity> | EntityDTO<Entity>[] | null {
    if (dbData === null) return null;
    const isArray = Array.isArray(dbData);
    if (isArray) {
      return dbData.map((entity) => this.transformSingle(entity, schema));
    } else {
      return this.transformSingle(dbData, schema);
    }
  }

  private transformSingle<Entity>(
    dbData: EntityDTO<Entity>,
    schema: Type<BaseSchema<any>>,
  ) {
    const attributes = getAttributes(schema);
    const relations = getRelations(schema);
    const result = {};
    for (const attribute of attributes) {
      if (dbData && attribute.dataKey in dbData) {
        result[attribute.name] = dbData[attribute.dataKey];
      }
    }

    for (const relation of relations) {
      const relSchema = relation.schema();
      if (dbData && relation.dataKey in dbData) {
        result[relation.name] = this.transformFromDb(
          dbData[relation.dataKey],
          relSchema,
        );
      }
    }
    return result;
  }

  transformToDb(
    schemaData: Record<string, unknown>,
    schema: Type<BaseSchema<any>>,
  ): Record<string, unknown> {
    const attributes = getAttributes(schema);

    return attributes.reduce((result, attribute) => {
      if (attribute.name in schemaData) {
        result[attribute.dataKey] = schemaData[attribute.name];
      }
      return result;
    }, {});
  }
}
