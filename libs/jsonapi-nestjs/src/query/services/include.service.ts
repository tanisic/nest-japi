import { BaseSchema, getRelationByName } from "../../schema";
import { Type } from "@nestjs/common";
import { JapiError } from "ts-japi";

export class IncludeService {
  constructor(private schema: Type<BaseSchema<any>>) {}

  transform(value: string): string[] {
    if (!value) {
      return null;
    }

    const fields: string[] = value.split(",");
    const includes: string[] = [];
    for (const field of fields) {
      const fieldParts = field.split(".").map((field) => field.trim());

      if (fieldParts.length > 1) {
        const dbFields = this.validateNested(fieldParts);
        includes.push(dbFields.join("."));
      } else {
        const dbField = this.validateSingle(field);
        includes.push(dbField);
      }
    }

    return includes;
  }

  private validateSingle(field: string) {
    const relation = getRelationByName(this.schema, field);
    if (!relation) {
      throw new JapiError({
        status: "400",
        source: { parameter: "include" },
        detail: `Relation "${field}" does not exist on ${this.schema.name} schema.`,
      });
    }
    return relation.dataKey;
  }

  private validateNested(fieldParts: string[]) {
    let currentSchema = this.schema;

    const dbFields: string[] = [];
    for (const part of fieldParts) {
      const exists = getRelationByName(currentSchema, part);
      if (!exists) {
        throw new JapiError({
          status: "400",
          source: { parameter: "include" },
          detail: `Relation "${part}" does not exist on ${currentSchema.name} schema.`,
        });
      }

      dbFields.push(exists.dataKey);
      currentSchema = exists.schema();
    }
    return dbFields;
  }
}
