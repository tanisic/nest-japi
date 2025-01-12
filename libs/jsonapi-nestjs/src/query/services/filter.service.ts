import { Injectable, BadRequestException, Type } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import {
  BaseSchema,
  getAttributeByName,
  getRelationByName,
} from "../../schema";

@Injectable()
export class FilterService {
  constructor(private readonly schema: Type<BaseSchema<any>>) {}

  transform<T>(filters: Record<string, any>): FilterQuery<T> {
    if (!filters || typeof filters !== "object") {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: "Filters must be a valid object.",
      });
    }

    const transformedFilters: FilterQuery<T> = {};

    for (const key of Object.keys(filters)) {
      const value = filters[key];

      if (key.startsWith("$")) {
        transformedFilters[key] = this.handleLogicalOperator(value);
      } else if (key.includes(".")) {
        this.applyNestedFilter(transformedFilters, key, value);
      } else {
        this.validateSingle(key);
        const field = getAttributeByName(this.schema, key);
        transformedFilters[field.dataKey] = value;
      }
    }

    return transformedFilters;
  }

  private handleLogicalOperator(value: any): any {
    if (!Array.isArray(value)) {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: "Logical operator filters must be arrays.",
      });
    }

    return value.map((condition) => {
      if (typeof condition !== "object") {
        throw new JapiError({
          status: "400",
          source: { parameter: "filter" },
          detail: "Conditions must be objects.",
        });
      }
      return this.transform(condition);
    });
  }

  private applyNestedFilter<T>(
    transformedFilters: FilterQuery<T>,
    key: string,
    value: any,
  ) {
    const fields = key.split(".");
    let current = transformedFilters;
    let currentSchema = this.schema;

    for (let i = 0; i < fields.length; i++) {
      const part = fields[i];
      const isLastField = i === fields.length - 1;

      // Validate the part as a relation or attribute
      const relation = getRelationByName(currentSchema, part);

      if (relation) {
        // If it's a relation, navigate deeper
        if (!current[relation.dataKey]) {
          current[relation.dataKey] = isLastField ? value : {};
        }
        current = current[relation.dataKey] as FilterQuery<T>;
        currentSchema = relation.schema();
      } else if (isLastField) {
        // If it's not a relation, validate it as an attribute
        const attribute = getAttributeByName(currentSchema, part);
        if (!attribute) {
          throw new JapiError({
            status: "400",
            source: { parameter: "filter" },
            detail: `"${part}" is not a valid attribute or relation in ${currentSchema.name} schema.`,
          });
        }
        current[attribute.dataKey] = value;
      } else {
        // If it's neither a relation nor a valid path, throw an error
        throw new JapiError({
          status: "400",
          source: { parameter: "filter" },
          detail: `Invalid nested path "${part}" in ${currentSchema.name} schema.`,
        });
      }
    }
  }

  private validateSingle(field: string) {
    const attribute = getAttributeByName(this.schema, field);
    if (!attribute) {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: `Relation "${field}" does not exist on ${this.schema.name} schema.`,
      });
    }
  }
}
