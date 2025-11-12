import { ApiQuery } from "@nestjs/swagger";
import { SwaggerMethodProps } from "./types";
import { MethodName } from "../controller/types";
import {
  BaseSchema,
  getAttributes,
  getRelations,
  getSchemasFromResource,
  getType,
} from "../schema";
import { Type } from "@nestjs/common";
import { FilterOperators, LogicalOperators } from "./filter-operators";

export function registerSparseFieldsSwaggerSchema({
  resource,
  schema,
  descriptor,
}: {
  resource: Type<object>;
  schema?: Type<BaseSchema>;
  descriptor: PropertyDescriptor;
}) {
  const { schema: resourceSchema } = getSchemasFromResource(resource);
  schema = schema || resourceSchema;
  const attributes = getAttributes(schema);
  const type = getType(schema);
  const relations = getRelations(schema);

  let withRelation = {};

  if (relations.length) {
    const relSchema = relations[0]!.schema();
    const relType = getType(relSchema);
    const relAttributes = getAttributes(relSchema)
      .map((attr) => attr.name)
      .join(",");
    withRelation = {
      summary: `Select some fields from relation (picked "${relations[0]!.name}" relation as example)`,
      value: {
        [relType]: relAttributes,
      },
    };
  }
  ApiQuery({
    name: "fields",
    required: false,
    style: "deepObject",
    schema: {
      type: "object",
    },
    examples: {
      allField: {
        summary: "Select all fields on same resource.",
        description: "Select all fields for current resource.",
        value: {
          [type]: attributes.map((attr) => attr.name).join(","),
        },
      },
      someFields: {
        summary: "Select some fields on same resource",
        description: "Select field for target and relation",
        value: {
          [type]: attributes
            .map((attr) => attr.name)
            .filter((_, index) => index % 2 === 0)
            .join(","),
        },
      },
      withRelation,
    },
    description: `Pick which attributes to show in response for each JSON:API type on "${schema.name}" resource`,
  })(resource, "getAll", descriptor);
}

export function swaggerSparseFieldsQueryParams({
  resource,
  descriptor,
  schemas,
  methodName,
}: Omit<SwaggerMethodProps, "resourceOptions"> & { methodName: MethodName }) {
  const schema = schemas.schema;
  const attributes = getAttributes(schema);
  const type = getType(schema);
  const relations = getRelations(schema);

  let withRelation = {};

  if (relations.length) {
    const relSchema = relations[0]!.schema();
    const relType = getType(relSchema);
    const relAttributes = getAttributes(relSchema)
      .map((attr) => attr.name)
      .join(",");
    withRelation = {
      summary: `Select some fields from relation (picked "${relations[0]!.name}" relation as example)`,
      value: {
        [relType]: relAttributes,
      },
    };
  }
  ApiQuery({
    name: "fields",
    required: false,
    style: "deepObject",
    schema: {
      type: "object",
    },
    examples: {
      allField: {
        summary: "Select all fields on same resource.",
        description: "Select all fields for current resource.",
        value: {
          [type]: attributes.map((attr) => attr.name).join(","),
        },
      },
      someFields: {
        summary: "Select some fields on same resource",
        description: "Select field for target and relation",
        value: {
          [type]: attributes
            .map((attr) => attr.name)
            .filter((_, index) => index % 2 === 0)
            .join(","),
        },
      },
      withRelation,
    },
    description: `Pick which attributes to show in response for each JSON:API type on "${schema.name}" resource`,
  })(resource, methodName, descriptor);
}

export function registerIncludesQueryParamsSwaggerSchema({
  resource,
  schema,
  descriptor,
}: {
  resource: Type<object>;
  schema?: Type<BaseSchema>;
  descriptor: PropertyDescriptor;
}) {
  const { schema: resourceSchema } = getSchemasFromResource(resource);
  schema = schema || resourceSchema;
  const relations = getRelations(schema);
  let nestedRelations = {};

  if (relations.length) {
    const finalArray: string[] = [];
    for (const relation of relations) {
      const relationSchema = relation.schema();
      const nestedRelations = getRelations(relationSchema);
      for (const nestedRelation of nestedRelations) {
        finalArray.push(`${relation.name}.${nestedRelation.name}`);
      }
    }
    if (finalArray.length) {
      nestedRelations = {
        summary: "With nested relation includes",
        value: finalArray.join(","),
      };
    }
  }
  ApiQuery({
    name: "include",
    required: false,
    description: `"${schema.name}" resource item has been extended with related objects.`,
    examples: {
      withInclude: {
        summary: "Add all relations without nesting",
        value: relations.map((rel) => rel.name).join(","),
      },
      nestedRelations,
    },
  })(resource, "getAll", descriptor);
}

export function swaggerIncludesQueryParams({
  resource,
  descriptor,
  schemas,
  methodName,
}: Omit<SwaggerMethodProps, "resourceOptions"> & { methodName: MethodName }) {
  const schema = schemas.schema;
  const relations = getRelations(schema);
  let nestedRelations = {};

  if (relations.length) {
    const finalArray: string[] = [];
    for (const relation of relations) {
      const relationSchema = relation.schema();
      const nestedRelations = getRelations(relationSchema);
      for (const nestedRelation of nestedRelations) {
        finalArray.push(`${relation.name}.${nestedRelation.name}`);
      }
    }
    if (finalArray.length) {
      nestedRelations = {
        summary: "With nested relation includes",
        value: finalArray.join(","),
      };
    }
  }
  ApiQuery({
    name: "include",
    required: false,
    description: `"${schema.name}" resource item has been extended with related objects.`,
    examples: {
      withInclude: {
        summary: "Add all relations without nesting",
        value: relations.map((rel) => rel.name).join(","),
      },
      nestedRelations,
    },
  })(resource, methodName, descriptor);
}

export const registerPaginationQueryParamsSwaggerSchema = ({
  resource,
  schema,
  descriptor,
}: {
  resource: Type<object>;
  schema?: Type<BaseSchema>;
  descriptor: PropertyDescriptor;
}) => {
  const { schema: resourceSchema } = getSchemasFromResource(resource);
  schema = schema || resourceSchema;
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
    description: `"${schema.name}" resource is using pagination with this params.`,
  })(resource, "getAll", descriptor);
};

export const registerSortQueryParamsSwaggerSchema = ({
  resource,
  schema,
  descriptor,
}: {
  resource: Type<object>;
  schema?: Type<BaseSchema>;
  descriptor: PropertyDescriptor;
}) => {
  const { schema: resourceSchema } = getSchemasFromResource(resource);
  schema = schema || resourceSchema;

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
};

export const registerFilterQueryParamsSwaggerSchema = ({
  resource,
  schema,
  descriptor,
}: {
  resource: Type<object>;
  schema?: Type<BaseSchema>;
  descriptor: PropertyDescriptor;
}) => {
  const { schema: resourceSchema } = getSchemasFromResource(resource);
  schema = schema || resourceSchema;

  const relations = getRelations(schema);
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
};

export const errorJsonApiSwaggerSchema = {
  type: "object",
  properties: {
    statusCode: {
      type: "number",
    },
    error: {
      type: "string",
    },
    message: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: {
            type: "string",
          },
          message: {
            type: "string",
          },
          path: {
            type: "array",
            items: {
              type: "string",
            },
          },
          keys: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["code", "message", "path"],
      },
    },
  },
};
