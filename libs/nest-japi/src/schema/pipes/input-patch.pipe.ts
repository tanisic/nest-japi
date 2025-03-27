import { ArgumentMetadata, Inject, PipeTransform } from "@nestjs/common";
import { CURRENT_SCHEMAS } from "../../constants";
import { type Schemas } from "../types";
import { JapiError } from "ts-japi";
import { jsonApiPatchInputSchema } from "../zod";
import { errorMap } from "zod-validation-error";
import { ZodIssuesExeption } from "../zod/zod-issue.exception";

export class JsonApiInputPatchPipe implements PipeTransform {
  @Inject(CURRENT_SCHEMAS) schemas: Schemas;

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schemas.updateSchema) {
      throw new JapiError({
        status: 500,
        detail: `${this.schemas.updateSchema.name}: Missing updateSchema definition.`,
      });
    }

    if (metadata.type !== "body") {
      return value;
    }

    const result = await jsonApiPatchInputSchema(
      this.schemas.updateSchema,
    ).safeParseAsync(value, { errorMap: errorMap });

    if (result.success) {
      return result.data;
    }

    throw new ZodIssuesExeption(result.error);
  }
}
