import { BaseSchema, getAttributeByName } from "../../schema";
import { Type } from "@nestjs/common";
import { JapiError } from "ts-japi";

export interface SparseFields {
  [type: string]: string[];
}

export class SparseFieldsService {
  constructor(private globalSchemaMap: Map<string, Type<BaseSchema<any>>>) {}

  transform(value: Record<string, string>): SparseFields {
    if (!value) {
      return null;
    }

    const result: SparseFields = {};
    for (const type in value) {
      // Get unique field names
      const fields = [...new Set(value[type].split(","))];
      const dbFields = this.validate(type, fields);
      result[type] = dbFields;
    }

    return result;
  }

  validate(type: string, fields: string[]) {
    const schema = this.globalSchemaMap.get(type);

    const dbTransformed: string[] = [];
    if (!schema) {
      throw new JapiError({
        status: "400",
        detail: `Schema with type "${type}" does not exist.`,
        source: { parameter: "fields" },
      });
    }

    for (const field of fields) {
      const attribute = getAttributeByName(schema, field);
      if (!attribute) {
        throw new JapiError({
          status: "400",
          detail: `Attribute "${field}" does not exist on ${schema.name} schema.`,
          source: { parameter: "fields" },
        });
      }
      dbTransformed.push(attribute.dataKey);
    }
    return dbTransformed;
  }
}
