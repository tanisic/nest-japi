import { ApiBody, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import { jsonApiPatchInputSchema } from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function patchOne({
  resource,
  schemas,
  descriptor,
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
    schema: generateSchema(jsonApiPatchInputSchema(schemas.schema)) as any,
    content: {
      [JSONAPI_CONTENT_TYPE]: {},
    },
  })(resource, "patchOne", descriptor);
}
