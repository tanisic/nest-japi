import { ArgumentMetadata, Inject, PipeTransform } from "@nestjs/common";
import { CURRENT_SCHEMAS } from "../../constants";
import { type Schemas } from "../types";
import { JapiError } from "ts-japi";
import { jsonApiPostInputSchema } from "../zod";
import { errorMap } from "zod-validation-error";
import { ZodIssuesExeption } from "../zod/zod-issue.exception";

export class JsonApiInputPostPipe implements PipeTransform {
  @Inject(CURRENT_SCHEMAS) schemas: Schemas;

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schemas.createSchema) {
      throw new JapiError({
        status: 500,
        detail: `${this.schemas.createSchema.name}: Missing createSchema definition.`,
      });
    }

    if (metadata.type !== "body") {
      return value;
    }

    const result = await jsonApiPostInputSchema(
      this.schemas.createSchema,
    ).safeParseAsync(value, { errorMap: errorMap });

    if (result.success) {
      return result.data;
    }

    throw new ZodIssuesExeption(result.error);
  }
}
