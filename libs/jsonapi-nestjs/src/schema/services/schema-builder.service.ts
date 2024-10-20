import { Injectable, Type } from "@nestjs/common";
import { BaseSchema } from "../base-schema";
import type { Schemas } from "../types";
import { EntityDTO } from "@mikro-orm/core";
import {
  getAttributeByDataKey,
  getAttributes,
  getRelations,
} from "../helpers/schema-helper";

@Injectable()
export class SchemaBuilderService {
  constructor(
    private globalSchemaMap: Map<string, Type<BaseSchema<any>>>,
    private schemas: Schemas,
  ) {}

  transformFromDb<Entity>(
    dbData: EntityDTO<Entity> | EntityDTO<Entity>[],
    schema: Type<BaseSchema<any>>,
  ): EntityDTO<Entity> | EntityDTO<Entity>[] {
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
}
