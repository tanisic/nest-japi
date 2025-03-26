import { ApiQuery } from "@nestjs/swagger";
import { SwaggerMethodProps } from "./types";
import { MethodName } from "../controller/types";
import { getAttributes, getRelations, getType } from "../schema";

export function swaggerSparseFieldsQueryParams({
  resource,
  descriptor,
  schemas,
  methodName,
}: SwaggerMethodProps & { methodName: MethodName }) {
  const schema = schemas.schema;
  const attributes = getAttributes(schema);
  const type = getType(schema);
  const relations = getRelations(schema);

  let withRelation = {};

  if (relations.length) {
    const relSchema = relations[0].schema();
    const relType = getType(relSchema);
    const relAttributes = getAttributes(relSchema)
      .map((attr) => attr.name)
      .join(",");
    withRelation = {
      summary: `Select some fields from relation (picked "${relations[0].name}" relation as example)`,
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

export function swaggerIncludesQueryParams({
  resource,
  descriptor,
  schemas,
  methodName,
}: SwaggerMethodProps & { methodName: MethodName }) {
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
