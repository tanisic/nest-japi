import { ApiBody, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import {
  fullJsonApiResponseSchema,
  jsonApiPatchInputSchema,
  jsonApiPatchRelationInputSwaggerSchema,
} from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function patchRelationship({
  resource,
  schemas,
  descriptor,
}: SwaggerMethodProps) {
  ApiBody({
    schema: generateSchema(jsonApiPatchRelationInputSwaggerSchema()) as any,
    required: true,
  })(resource, "patchRelationship", descriptor);
  ApiProduces(JSONAPI_CONTENT_TYPE)(resource, "patchRelationship", descriptor);
  ApiResponse({
    status: 200,
    schema: generateSchema(
      fullJsonApiResponseSchema(schemas.updateSchema || schemas.schema, {
        hasIncludes: false,
        withPagination: false,
      }),
    ) as any,
    content: {
      [JSONAPI_CONTENT_TYPE]: {},
    },
  })(resource, "patchRelationship", descriptor);
}
