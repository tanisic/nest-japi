import {
  BaseSchema,
  getAttribute,
  getSchemasFromResource,
  getType,
} from "../../schema";
import { Type } from "@nestjs/common";
import { JsonApiOptions } from "../../modules/json-api-options";
import { JapiError } from "ts-japi";

export interface SparseFields {
  [type: string]: string[];
}

export class SparseFieldsService {
  private globalSchemaMap: Map<string, Type<BaseSchema<any>>>;

  constructor(private options: JsonApiOptions) {
    this.globalSchemaMap = new Map();

    for (const resource of this.options.global.resources) {
      const schemas = getSchemasFromResource(resource);
      const viewSchema = schemas.schema;
      const type = getType(viewSchema);
      this.globalSchemaMap.set(type, viewSchema);
    }
  }

  transform(value: Record<string, string>): SparseFields {
    if (!value) {
      return null;
    }

    const result: SparseFields = {};
    for (const type in value) {
      // Get unique field names
      const fields = [...new Set(value[type].split(","))];
      this.validate(type, fields);
      result[type] = fields;
    }

    return result;
  }

  validate(type: string, fields: string[]) {
    const schema = this.globalSchemaMap.get(type);

    if (!schema) {
      throw new JapiError({
        status: "400",
        detail: `Schema with type "${type}" does not exist.`,
        source: { parameter: "fields" },
      });
    }

    for (const field of fields) {
      const attribute = getAttribute(schema, field);
      if (!attribute) {
        throw new JapiError({
          status: "400",
          detail: `Attribute "${field}" does not exist on ${schema.name} schema.`,
          source: { parameter: "fields" },
        });
      }
    }
  }
}
