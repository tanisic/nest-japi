import { Injectable, type Type } from "@nestjs/common";
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

  transform<T>(
    filters: Record<string, any>,
    currentSchema = this.schema,
  ): FilterQuery<T> {
    const transformedFilters: FilterQuery<T> = {};

    for (const [key, value] of Object.entries(filters)) {
      const relation = getRelationByName(currentSchema, key);
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
        transformedFilters[attribute.dataKey] = this.transform(
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
    relation: RelationOptions<Schema>,
    value: FilterQuery<unknown>,
  ): FilterQuery<unknown> {
    const relationSchema = relation.schema();
    return this.transform(value, relationSchema);
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
