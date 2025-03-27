import { ApiProperty } from "@nestjs/swagger";
export enum LogicalOperators {
  and = "$and",
  or = "$or",
  not = "$not",
}
export enum FilterOperators {
  eq = "$eq",
  gt = "$gt",
  gte = "$gte",
  lt = "$lt",
  lte = "$lte",
  ne = "$ne",
  like = "$like",
  re = "$re",
  fulltext = "$fulltext",
  ilike = "$ilike",
  nin = "$nin",
  in = "$in",
}

export class FilterOperatorsSwagger {
  @ApiProperty({
    title: FilterOperators.in,
    required: false,
    type: "array",
    items: {
      type: "string",
    },
  })
  [FilterOperators.in]!: string[];

  @ApiProperty({
    title: FilterOperators.nin,
    required: false,
    type: "array",
    items: {
      type: "string",
    },
  })
  [FilterOperators.nin]!: string[];

  @ApiProperty({
    title: FilterOperators.eq,
    required: false,
  })
  [FilterOperators.eq]!: string;

  @ApiProperty({
    title: FilterOperators.ne,
    required: false,
  })
  [FilterOperators.ne]!: string;

  @ApiProperty({
    title: FilterOperators.gte,
    required: false,
  })
  [FilterOperators.gte]!: string;

  @ApiProperty({
    title: FilterOperators.gt,
    required: false,
  })
  [FilterOperators.gt]!: string;

  @ApiProperty({
    title: FilterOperators.lt,
    required: false,
  })
  [FilterOperators.lt]!: string;

  @ApiProperty({
    title: FilterOperators.lte,
    required: false,
  })
  [FilterOperators.lte]!: string;

  @ApiProperty({
    title: FilterOperators.re,
    required: false,
  })
  [FilterOperators.re]!: string;

  @ApiProperty({
    title: FilterOperators.like,
    required: false,
  })
  [FilterOperators.like]!: string;

  @ApiProperty({
    title: FilterOperators.ilike,
    required: false,
  })
  [FilterOperators.ilike]!: string;
}
