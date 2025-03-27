import { ApiBody, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import { jsonApiPatchInputSchema } from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function postOne({ resource, schemas, descriptor }: SwaggerMethodProps) {
  ApiBody({
    //@ts-expect-error
    schema: generateSchema(
      jsonApiPatchInputSchema(schemas.updateSchema || schemas.schema),
    ),
    required: true,
  })(resource, "postOne", descriptor);
  ApiProduces(JSONAPI_CONTENT_TYPE)(resource, "postOne", descriptor);
  ApiResponse({
    status: 200,
    schema: generateSchema(jsonApiPatchInputSchema(schemas.schema)) as any,
    content: {
      [JSONAPI_CONTENT_TYPE]: {},
    },
  })(resource, "postOne", descriptor);
}
