import { SwaggerMethodProps } from "../types";
import {
  swaggerIncludesQueryParams,
  swaggerSparseFieldsQueryParams,
} from "../common";

export function getOne({ resource, descriptor, schemas }: SwaggerMethodProps) {
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
}
