import { ApiBody, ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import { generateSchema } from "@anatine/zod-openapi";
import {
  fullJsonApiResponseSchema,
  jsonApiPostInputSchema,
} from "../../schema";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function postOne({
  resource,
  schemas,
  descriptor,
  resourceOptions,
}: SwaggerMethodProps) {
  const schema = schemas.createSchema || schemas.schema;
  ApiBody({
    //@ts-expect-error
    schema: generateSchema(jsonApiPostInputSchema(schema)),
    required: true,
  })(resource, "postOne", descriptor);
  ApiResponse({
    status: 201,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        schema: generateSchema(
          fullJsonApiResponseSchema(schemas.schema, {
            dataArray: false,
            hasIncludes: false,
            withPagination: false,
            resourceMetaSchema: resourceOptions.metaSchemas?.postOne?.resource,
            documentMetaSchema: resourceOptions.metaSchemas?.postOne?.document,
          }),
        ) as any,
      },
    },
  })(resource, "postOne", descriptor);
}
