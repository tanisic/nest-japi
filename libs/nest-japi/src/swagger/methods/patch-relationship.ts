import { ApiBody, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import {
  fullJsonApiResponseSchema,
  jsonApiPatchRelationInputSwaggerSchema,
} from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function patchRelationship({
  resource,
  schemas,
  descriptor,
  resourceOptions,
}: SwaggerMethodProps) {
  ApiBody({
    schema: generateSchema(jsonApiPatchRelationInputSwaggerSchema()) as any,
    required: true,
  })(resource, "patchRelationship", descriptor);
  ApiProduces(JSONAPI_CONTENT_TYPE)(resource, "patchRelationship", descriptor);
  ApiResponse({
    status: 200,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        schema: generateSchema(
          fullJsonApiResponseSchema(schemas.schema, {
            hasIncludes: false,
            withPagination: false,
            resourceMetaSchema:
              resourceOptions.metaSchemas?.patchRelationship?.resource,
            documentMetaSchema:
              resourceOptions.metaSchemas?.patchRelationship?.document,
          }),
        ) as any,
      },
    },
  })(resource, "patchRelationship", descriptor);
}
