import { OrderDefinition, QueryOrderMap } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import { BaseSchema, getAttribute, getRelation } from "../../schema";
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

      if (fieldParts.length > 1) {
        this.validateRelation(fieldParts);
        const criteria = this.createObjectChain(fieldParts, sortOrder);
        sortCriteria.push(criteria);
      } else {
        this.validateField(fieldName);
        sortCriteria.push({ [fieldName]: sortOrder });
      }
    }

    return sortCriteria;
  }

  private validateField(fieldName: string) {
    const attribute = getAttribute(this.schema, fieldName);

    if (!attribute) {
      throw new JapiError({
        status: "400",
        detail: `Field ${fieldName} does not exist on ${this.schema.name} schema.`,
        source: { parameter: "sort" },
      });
    }
  }

  private validateRelation(fieldParts: string[]) {
    let currentSchema = this.schema;

    for (const [index, field] of fieldParts.entries()) {
      const relation = getRelation(currentSchema, field);
      const isLastIndex = index === fieldParts.length - 1;

      // Field on last index should be attribute, not relation
      if (isLastIndex) {
        const attribute = getAttribute(currentSchema, field);
        if (!attribute) {
          throw new JapiError({
            status: "400",
            detail: `Field ${field} is not valid attribute on ${currentSchema.name} schema.`,
            source: { parameter: "sort" },
          });
        }

        return;
      }

      if (!relation) {
        throw new JapiError({
          status: "400",
          detail: `Field ${field} is not valid relation on ${currentSchema.name} schema.`,
          source: { parameter: "sort" },
        });
      }

      currentSchema = relation.schema();
    }
  }

  private createObjectChain(
    fields: string[],
    sort: "DESC" | "ASC",
  ): QueryOrderMap<any> {
    return fields.reduceRight((acc, field) => ({ [field]: acc }) as any, sort);
  }
}
