import { ApiResponse } from "@nestjs/swagger";
import { SwaggerMethodProps } from "../types";
import {
  swaggerIncludesQueryParams,
  swaggerSparseFieldsQueryParams,
} from "../common";
import { generateSchema } from "@anatine/zod-openapi";
import { fullJsonApiResponseSchema } from "../../schema/zod/common";
import { JSONAPI_CONTENT_TYPE } from "../../constants";

export function getOne({
  resource,
  descriptor,
  schemas,
  resourceOptions,
}: SwaggerMethodProps) {
  swaggerSparseFieldsQueryParams({
    resource,
    descriptor,
    schemas,
    methodName: "getOne",
  });
  swaggerIncludesQueryParams({
    resource,
    descriptor,
    schemas,
    methodName: "getOne",
  });

  ApiResponse({
    status: 200,
    content: {
      [JSONAPI_CONTENT_TYPE]: {
        // @ts-expect-error imported SchemaObject type mismatch with openapi ts types
        schema: generateSchema(
          fullJsonApiResponseSchema(schemas.schema, {
            hasIncludes: true,
            withPagination: false,
            dataArray: false,
            resourceMetaSchema: resourceOptions.metaSchemas?.getOne?.resource,
            documentMetaSchema: resourceOptions.metaSchemas?.getOne?.document,
          }),
        ),
      },
    },
  })(resource, "getOne", descriptor);
}
