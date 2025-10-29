import {
  ApiExtraModels,
  ApiParam,
  ApiProduces,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { getRelations, jsonApiPatchRelationInputSchema } from "../../schema";
import {
  JSONAPI_CONTENT_TYPE,
  PARAMS_RELATION_NAME,
  PARAMS_RESOURCE_ID,
} from "../../constants";
import { createZodDto } from "@anatine/zod-nestjs";
import { namedClass } from "../../helpers";
import { generateSchema } from "@anatine/zod-openapi";

export function getRelationship({
  resource,
  schemas,
  descriptor,
  resourceOptions,
}: SwaggerMethodProps) {
  const { schema } = schemas;
  const relationships = getRelations(schema);

  const dtos = relationships.map((rel) => {
    if (rel.many) {
      console.log(
        JSON.stringify(
          generateSchema(
            jsonApiPatchRelationInputSchema(schema, rel.name as string).openapi(
              {
                title: rel.name as string,
              },
            ),
            false,
            "3.0",
          ),
        ),
      );
    }
    return namedClass(
      `${schema.name}_rel_${rel.name}`,
      createZodDto(
        jsonApiPatchRelationInputSchema(schema, rel.name as string).openapi({
          title: rel.name as string,
        }),
      ),
    );
  });

  ApiProduces(JSONAPI_CONTENT_TYPE)(resource, "getRelationship", descriptor);
  ApiParam({
    name: PARAMS_RESOURCE_ID,
    required: true,
    schema: { type: "string" },
  })(resource, "getRelationship", descriptor);
  ApiParam({
    name: PARAMS_RELATION_NAME,
    required: true,
    schema: { type: "string", enum: relationships.map((rel) => rel.name) },
  })(resource, "getRelationship", descriptor);
  ApiResponse({
    status: 200,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        schema: {
          discriminator: {
            propertyName: "data",
            mapping: dtos.reduce(
              (old, dto) => ({ ...old, [dto.name]: getSchemaPath(dto) }),
              {},
            ),
          },
          oneOf: dtos.map((dto) => ({ $ref: getSchemaPath(dto.name) })),
        },
      },
    },
  })(resource, "getRelationship", descriptor);
}
