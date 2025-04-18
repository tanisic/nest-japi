import { SwaggerMethodProps } from "../types";
import {
  errorJsonApiSwaggerSchema,
  swaggerIncludesQueryParams,
  swaggerSparseFieldsQueryParams,
} from "../common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { getAttributes, getRelations } from "../../schema";
import { FilterOperators, LogicalOperators } from "../filter-operators";
import { generateSchema } from "@anatine/zod-openapi";
import { fullJsonApiResponseSchema } from "../../schema/zod/common";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function getAll({
  resource,
  descriptor,
  schemas,
  resourceOptions,
}: SwaggerMethodProps) {
  const schema = schemas.schema;

  swaggerSparseFieldsQueryParams({
    resource,
    descriptor,
    schemas,
    methodName: "getAll",
  });
  swaggerIncludesQueryParams({
    resource,
    descriptor,
    schemas,
    methodName: "getAll",
  });

  const attributes = getAttributes(schema);

  const sortFieldsAsc = attributes
    .map((attr) => attr.name)
    .filter((_, idx) => idx % 2 === 0)
    .join(",");
  const sortFieldsDesc = attributes
    .map((attr) => `-${attr.name}`)
    .filter((_, idx) => idx % 2 === 0)
    .join(",");

  const relations = getRelations(schema);

  const relationSorts: string[] = [];
  for (const relation of relations) {
    const relSchema = relation.schema();
    const relAttributes = getAttributes(relSchema);
    for (const [idx, attribute] of relAttributes.entries()) {
      if (idx % 3 === 0) continue;
      relationSorts.push(
        `${Math.random() < 0.5 ? "" : `-`}${relation.name}.${attribute.name}`,
      );
    }
  }

  ApiQuery({
    name: "sort",
    type: "string",
    required: false,
    description: `Params for sorting of "${schema.name}"`,
    examples: {
      sortAscMultiple: {
        summary: "Sort fields by ASC",
        value: sortFieldsAsc,
      },
      sortDescMultiple: {
        summary: "Sort fields by DESC",
        value: sortFieldsDesc,
      },
      // @ts-expect-error
      sortByRelation: relations.length
        ? {
            summary: "Sort by nested relation field",
            value: relationSorts.join(","),
          }
        : undefined,
    },
  })(resource, "getAll", descriptor);

  ApiQuery({
    name: "page",
    style: "deepObject",
    required: false,
    schema: {
      type: "object",
      examples: [
        {
          number: 1,
          size: 50,
        },
      ],
      properties: {
        number: {
          type: "integer",
          minimum: 1,
        },
        size: {
          type: "integer",
          minimum: 1,
          maximum: 1000,
        },
      },
      additionalProperties: false,
    },
    description: `"${schema.name}" resource has been limit and offset with this params.`,
  })(resource, "getAll", descriptor);

  let getRelationByConditional = {};

  if (relations.length) {
    const relationAttr = getAttributes(relations[0]!.schema())[0]!.name;
    getRelationByConditional = {
      summary: "Get if relation field is",
      description: "Get if relation field is",
      value: JSON.stringify({
        [relations[0]!.name]: {
          [relationAttr]: {
            $eq: 123,
          },
        },
      }),
    };
  }

  ApiQuery({
    name: "filter",
    required: false,
    explode: true,
    schema: {
      type: "object",
      properties: {
        logicalOperators: {
          properties: Object.values(LogicalOperators).reduce((acum, name) => {
            return { ...acum, [name]: { type: "any[]" } };
          }, {}),
        },
        operators: {
          properties: Object.values(FilterOperators).reduce((acum, name) => {
            return { ...acum, [name]: { type: "any" } };
          }, {}),
        },
      },
    },
    examples: {
      simpleExample: {
        summary:
          "Several conditional - this means Id is in 1,2,3 AND numberOfUsers is greater than or equal to 1.",
        description: "Get if relation is not null",
        value: JSON.stringify({
          id: {
            in: [1, 2, 3],
          },
          numberOfUsers: {
            $gte: "1",
          },
        }),
      },
      complexLogicalOperators: {
        summary: "Complex with logical operators",
        value: JSON.stringify({
          $or: [
            { id: { $in: [123, 456, 789] } },
            { username: { $ilike: "Tom%" } },
          ],
        }),
      },
      getRelationByConditional,
    },
    description: `Object of filter for select items from "${schema.name}" resource`,
  })(resource, "getAll", descriptor);
  ApiResponse({
    status: 400,
    description: "Wrong query parameters",
    schema: errorJsonApiSwaggerSchema,
  })(resource, "getAll", descriptor);

  ApiResponse({
    status: 200,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        // @ts-expect-error imported SchemaObject type mismatch with openapi ts types
        schema: generateSchema(
          fullJsonApiResponseSchema(schema, {
            hasIncludes: true,
            withPagination: true,
            resourceMetaSchema: resourceOptions.metaSchemas?.getAll?.resource,
            documentMetaSchema: resourceOptions.metaSchemas?.getAll?.document,
          }),
        ),
      },
    },
  })(resource, "getAll", descriptor);
}
