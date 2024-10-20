import { FilterQuery } from "@mikro-orm/core";
import { BaseSchema, getRelationByName } from "../../schema";
import { Type } from "@nestjs/common";
import { JapiError } from "ts-japi";

export type Filter = FilterQuery<any>;

export class FilterService {
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
        this.validateNested(fieldParts);
        includes.push(field);
      } else {
        this.validateSingle(field);
        includes.push(field);
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
  }

  private validateNested(fieldParts: string[]) {
    let currentSchema = this.schema;

    for (const part of fieldParts) {
      const exists = getRelationByName(currentSchema, part);
      if (!exists) {
        throw new JapiError({
          status: "400",
          source: { parameter: "include" },
          detail: `Relation "${part}" does not exist on ${currentSchema.name} schema.`,
        });
      }
      currentSchema = exists.schema();
    }
  }
}
