import { OrderDefinition, QueryOrderMap } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import {
  BaseSchema,
  getAttributeByName,
  getRelationByName,
} from "../../schema";
import { Type } from "@nestjs/common";

export interface SortDefinitions {
  dbOrderBy: OrderDefinition<any>;
  schemaOrderBy: OrderDefinition<any>;
}

export class SortService {
  constructor(private schema: Type<BaseSchema<any>>) {}

  transform(value: string): SortDefinitions {
    if (!value) {
      return null;
    }

    const fields: string[] = value.split(",");
    const globalDbSortCriteria: OrderDefinition<any> = [];
    const globalSchemaSortCriteria: OrderDefinition<any> = [];
    for (const field of fields) {
      const sortOrder = field.startsWith("-") ? "DESC" : "ASC";
      const fieldName = field.startsWith("-") ? field.substring(1) : field;

      const fieldParts = fieldName.split(".").map((field) => field.trim());

      if (fieldParts.length > 1) {
        const { schemaSortCriteria, dbSortCriteria } =
          this.validateRelation(fieldParts);
        const schemaObjectChain = this.createObjectChain(
          schemaSortCriteria,
          sortOrder,
        );
        const dbObjectChain = this.createObjectChain(dbSortCriteria, sortOrder);
        globalDbSortCriteria.push(dbObjectChain);
        globalSchemaSortCriteria.push(schemaObjectChain);
      } else {
        const attribute = this.validateField(fieldName);
        globalDbSortCriteria.push({ [attribute.dataKey]: sortOrder });
        globalSchemaSortCriteria.push({ [attribute.name]: sortOrder });
      }
    }

    return {
      dbOrderBy: globalDbSortCriteria || [],
      schemaOrderBy: globalSchemaSortCriteria || [],
    };
  }

  private validateField(fieldName: string) {
    const attribute = getAttributeByName(this.schema, fieldName);

    if (!attribute) {
      throw new JapiError({
        status: "400",
        detail: `Field ${fieldName} does not exist on ${this.schema.name} schema.`,
        source: { parameter: "sort" },
      });
    }
    return attribute;
  }

  private validateRelation(fieldParts: string[]) {
    let currentSchema = this.schema;
    const dbSortCriteria: string[] = [];
    const schemaSortCriteria: string[] = [];

    for (const [index, field] of fieldParts.entries()) {
      const relation = getRelationByName(currentSchema, field);
      const isLastIndex = index === fieldParts.length - 1;

      // Field on last index should be attribute, not relation
      if (isLastIndex) {
        const attribute = getAttributeByName(currentSchema, field);
        if (!attribute) {
          throw new JapiError({
            status: "400",
            detail: `Field ${field} is not valid attribute on ${currentSchema.name} schema.`,
            source: { parameter: "sort" },
          });
        }

        dbSortCriteria.push(attribute.dataKey);
        schemaSortCriteria.push(attribute.name);

        return { dbSortCriteria, schemaSortCriteria };
      }

      if (!relation) {
        throw new JapiError({
          status: "400",
          detail: `Field ${field} is not valid relation on ${currentSchema.name} schema.`,
          source: { parameter: "sort" },
        });
      }

      dbSortCriteria.push(relation.dataKey);
      schemaSortCriteria.push(relation.name);

      currentSchema = relation.schema();
    }
    return { dbSortCriteria, schemaSortCriteria };
  }

  private createObjectChain(
    fields: string[],
    sort: "DESC" | "ASC",
  ): QueryOrderMap<any> {
    return fields.reduceRight((acc, field) => ({ [field]: acc }) as any, sort);
  }
}
