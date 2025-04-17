import { BaseSchema, getRelationByName } from "../../schema";
import { Type } from "@nestjs/common";
import { JapiError } from "ts-japi";

export interface Includes {
  dbIncludes: string[];
  schemaIncludes: string[];
}

export class IncludeService {
  constructor(private schema: Type<BaseSchema<any>>) {}

  transform(value: string): Includes {
    if (!value) {
      return { dbIncludes: [], schemaIncludes: [] };
    }

    const fields: string[] = value.split(",");
    const schemaIncludes: string[] = [];
    const dbIncludes: string[] = [];
    for (const field of fields) {
      const fieldParts = field.split(".").map((field) => field.trim());

      if (fieldParts.length > 1) {
        const { dbFields, schemaFields } = this.validateNested(fieldParts);
        schemaIncludes.push(schemaFields.join("."));
        dbIncludes.push(dbFields.join("."));
      } else {
        const relation = this.validateSingle(field);
        schemaIncludes.push(relation.name);
        dbIncludes.push(relation.dataKey as string);
      }
    }

    return { schemaIncludes, dbIncludes };
  }

  private validateSingle(field: string) {
    // @ts-expect-error
    const relation = getRelationByName(this.schema, field);
    if (!relation) {
      throw new JapiError({
        status: "400",
        source: { parameter: "include" },
        detail: `Relation "${field}" does not exist on ${this.schema.name} schema.`,
      });
    }
    return relation;
  }

  private validateNested(fieldParts: string[]) {
    let currentSchema = this.schema;

    const schemaFields: string[] = [];
    const dbFields: string[] = [];
    for (const part of fieldParts) {
      // @ts-expect-error
      const exists = getRelationByName(currentSchema, part);
      if (!exists) {
        throw new JapiError({
          status: "400",
          source: { parameter: "include" },
          detail: `Relation "${part}" does not exist on ${currentSchema.name} schema.`,
        });
      }

      dbFields.push(exists.dataKey as string);
      schemaFields.push(exists.name);
      currentSchema = exists.schema();
    }
    return { dbFields, schemaFields };
  }
}
