import { OrderDefinition, QueryOrderMap } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import {
  BaseSchema,
  getAttributeByName,
  getRelationByName,
} from "../../schema";
import { Type } from "@nestjs/common";

export class SortService {
  constructor(private schema: Type<BaseSchema<any>>) {}

  transform(value: string): OrderDefinition<any> {
    if (!value) {
      return null;
    }

    const fields: string[] = value.split(",");
    const sortCriteria: OrderDefinition<any> = [];
    for (const field of fields) {
      const sortOrder = field.startsWith("-") ? "DESC" : "ASC";
      const fieldName = field.startsWith("-") ? field.substring(1) : field;

      const fieldParts = fieldName.split(".").map((field) => field.trim());

      console.log({ fieldParts });
      if (fieldParts.length > 1) {
        const dbInclude = this.validateRelation(fieldParts);
        const criteria = this.createObjectChain(dbInclude, sortOrder);
        sortCriteria.push(criteria);
      } else {
        const attribute = this.validateField(fieldName);
        sortCriteria.push({ [attribute.dataKey]: sortOrder });
      }
    }

    return sortCriteria;
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
    const dbInclude: string[] = [];

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

        dbInclude.push(attribute.dataKey);

        return dbInclude;
      }

      if (!relation) {
        throw new JapiError({
          status: "400",
          detail: `Field ${field} is not valid relation on ${currentSchema.name} schema.`,
          source: { parameter: "sort" },
        });
      }

      dbInclude.push(relation.dataKey);

      currentSchema = relation.schema();
    }
    return dbInclude;
  }

  private createObjectChain(
    fields: string[],
    sort: "DESC" | "ASC",
  ): QueryOrderMap<any> {
    return fields.reduceRight((acc, field) => ({ [field]: acc }) as any, sort);
  }
}
