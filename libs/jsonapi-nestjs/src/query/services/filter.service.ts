import { Injectable, Type } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/core";
import { JapiError } from "ts-japi";
import {
  BaseSchema,
  getAttributeByName,
  getRelationByName,
} from "../../schema";
import { RelationOptions } from "../../decorators/relation.decorator";

@Injectable()
export class FilterService {
  constructor(private readonly schema: Type<BaseSchema<any>>) {}

  logicalOperatorKeys = ["$and", "$or", "$not"];
  collectionOperatorKeys = ["$some", "$none", "$every"];

  filterKeys = [
    "$eq",
    "$gt",
    "$gte",
    "$in",
    "$lt",
    "$lte",
    "$ne",
    "$nin",
    "$like",
    "$re",
    "$fulltext",
    "$ilike",
    "$overlap",
    "$contains",
    "$contained",
    "$hasKey",
    "$hasSomeKeys",
    "$hasKeys",
  ];

  transform<T>(
    filters: Record<string, any>,
    currentSchema = this.schema,
  ): FilterQuery<T> {
    const transformedFilters: FilterQuery<T> = {};

    for (const key of Object.keys(filters)) {
      const value = filters[key];
      const relation = getRelationByName(currentSchema, key);
      const attribute = getAttributeByName(currentSchema, key);

      if (this.logicalOperatorKeys.includes(key)) {
        transformedFilters[key] = this.handleLogicalOperator(value);
      } else if (this.filterKeys.includes(key)) {
        transformedFilters[key] = this.handleOperator(key, value);
      } else if (relation) {
        transformedFilters[relation.dataKey] = this.handleRelation(
          relation,
          value,
        );
      } else if (attribute) {
        transformedFilters[attribute.dataKey] = value;
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        transformedFilters[key] = value;
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
    return this.transform(value);
  }

  private handleRelation(
    relation: RelationOptions,
    value: FilterQuery<unknown>,
  ): FilterQuery<unknown> {
    return this.transform(value);
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
}
