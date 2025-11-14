import { Injectable, type Type } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import {
  BaseSchema,
  ExtractRelations,
  getAttributeByName,
  getRelationByName,
} from "../../schema";
import { RelationOptions } from "../../decorators/relation.decorator";

@Injectable()
export class FilterService {
  constructor(private readonly schema: Type<BaseSchema<any>>) {}

  logicalOperatorKeys = ["$and", "$or", "$not"];
  collectionOperatorKeys = ["$some", "$none", "$every"];

  singleFilterKeys = [
    "$eq",
    "$gt",
    "$gte",
    "$lt",
    "$lte",
    "$ne",
    "$like",
    "$re",
    "$fulltext",
    "$ilike",
    "$contains",
    "$contained",
    "$hasKey",
    "$hasSomeKeys",
    "$hasKeys",
    "$overlap",
  ];

  arrayFilterKeys = ["$nin", "$in"];

  filterKeys = [...this.singleFilterKeys, ...this.arrayFilterKeys];

  private tryParseArrayString(value: any): any[] | null {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();

    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Converts simple object filters into operator-based structure,
   * but does NOT allow operators. Supports nested relations.
   *
   * Example:
   *  { age: 20, user: { name: "John" } }
   *     → { age: { $eq: 20 }, user: { name: { $eq: "John" }}}
   */
  transformSimpleFilter(
    filters: Record<string, any>,
    currentSchema = this.schema,
  ): Record<string, any> {
    const out: Record<string, any> = {};

    for (const [fullKey, rawValue] of Object.entries(filters)) {
      if (fullKey.startsWith("$")) {
        throw new JapiError({
          status: "400",
          source: { parameter: "filter" },
          detail: `Operators are not allowed in simple filters: ${fullKey}`,
        });
      }

      const segments = fullKey.split(".");
      let schema = currentSchema;

      let target = out;
      let lastKey = segments[segments.length - 1] as string;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i] as string;

        // @ts-expect-error
        const relation = getRelationByName(schema, segment);
        const attribute = getAttributeByName(schema, segment);

        if (!relation && !attribute) {
          throw new JapiError({
            status: "400",
            source: { parameter: "filter" },
            detail: `${segment} is not an attribute or relation of ${schema.name}`,
          });
        }

        const isLast = i === segments.length - 1;

        if (!isLast) {
          // must be relation for nested segments
          if (!relation) {
            throw new JapiError({
              status: "400",
              source: { parameter: "filter" },
              detail: `${segment} must be a relation because deeper fields follow.`,
            });
          }

          if (!target[segment]) {
            target[segment] = {};
          }

          target = target[segment];
          schema = relation.schema();
        } else {
          // last segment
          if (relation) {
            throw new JapiError({
              status: "400",
              source: { parameter: "filter" },
              detail: `Relation '${segment}' cannot be filtered without specifying an attribute. (e.g. '${segment}.id')`,
            });
          }
        }
      }

      // --- Value handling (only for attributes) ---

      const parsedArray = this.tryParseArrayString(rawValue);
      if (parsedArray !== null) {
        target[lastKey] = { $in: parsedArray };
        continue;
      }

      if (
        typeof rawValue !== "object" ||
        rawValue === null ||
        rawValue instanceof Date
      ) {
        target[lastKey] = { $eq: rawValue };
        continue;
      }

      if (Array.isArray(rawValue)) {
        target[lastKey] = { $in: rawValue };
        continue;
      }

      if (Object.keys(rawValue).some((k) => k.startsWith("$"))) {
        throw new JapiError({
          status: "400",
          source: { parameter: "filter" },
          detail: `Operators are not allowed in simple filters at ${fullKey}`,
        });
      }

      target[lastKey] = this.transformSimpleFilter(rawValue, schema);
    }

    return out;
  }

  transformComplexFilter<T>(
    filters: Record<string, any>,
    currentSchema = this.schema,
  ): FilterQuery<T> {
    const transformedFilters: FilterQuery<T> = {};

    for (const [key, value] of Object.entries(filters)) {
      const relation = getRelationByName(
        currentSchema,
        key as keyof ExtractRelations<BaseSchema<any>>,
      );
      const attribute = getAttributeByName(currentSchema, key);

      if (this.logicalOperatorKeys.includes(key)) {
        // @ts-expect-error
        transformedFilters[key] = this.handleLogicalOperator(value);
      } else if (this.filterKeys.includes(key)) {
        // @ts-expect-error
        transformedFilters[key] = this.handleOperator(key, value);
      } else if (relation) {
        // @ts-expect-error
        transformedFilters[relation.dataKey] = this.handleRelation(
          relation,
          value,
        );
      } else if (attribute) {
        // @ts-expect-error
        transformedFilters[attribute.dataKey] = this.transformComplexFilter(
          value,
          currentSchema,
        );
      } else {
        throw new JapiError({
          status: "400",
          source: { parameter: "filter" },
          detail: `${key} not attribute or relation in ${currentSchema.name}`,
        });
      }
    }

    return transformedFilters;
  }
  private handleOperator(
    operator: string,
    value: FilterQuery<unknown>,
  ): FilterQuery<unknown> {
    if (this.arrayFilterKeys.includes(operator) && !Array.isArray(value)) {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: `Operator ${operator} must have value as array.`,
      });
    }
    if (this.singleFilterKeys.includes(operator) && Array.isArray(value)) {
      throw new JapiError({
        status: "400",
        source: { parameter: "filter" },
        detail: `Operator ${operator} cannot have value as array.`,
      });
    }
    return value;
  }

  private handleRelation<Schema extends BaseSchema<any>>(
    relation: RelationOptions<Schema, boolean, keyof ExtractRelations<Schema>>,
    value: FilterQuery<unknown>,
  ): FilterQuery<unknown> {
    const relationSchema = relation.schema();
    return this.transformComplexFilter(value, relationSchema);
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
      return this.transformComplexFilter(condition);
    });
  }
}
