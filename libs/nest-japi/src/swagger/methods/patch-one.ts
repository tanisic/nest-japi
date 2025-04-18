import { ApiBody, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import { jsonApiPatchInputSchema } from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";
import { fullJsonApiResponseSchema } from "../../schema/zod/common";

export function patchOne({
  resource,
  schemas,
  descriptor,
  resourceOptions,
}: SwaggerMethodProps) {
  ApiBody({
    schema: generateSchema(
      jsonApiPatchInputSchema(schemas.updateSchema || schemas.schema),
    ) as any,
    required: true,
  })(resource, "patchOne", descriptor);
  ApiProduces(JSONAPI_CONTENT_TYPE)(resource, "patchOne", descriptor);
  ApiResponse({
    status: 200,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        schema: generateSchema(
          fullJsonApiResponseSchema(schemas.schema, {
            withPagination: false,
            dataArray: false,
            hasIncludes: false,
            resourceMetaSchema: resourceOptions.metaSchemas?.patchOne?.resource,
            documentMetaSchema: resourceOptions.metaSchemas?.patchOne?.document,
          }),
        ) as any,
      },
    },
  })(resource, "patchOne", descriptor);
}
