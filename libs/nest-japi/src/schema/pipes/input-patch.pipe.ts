import { ArgumentMetadata, PipeTransform, Type } from "@nestjs/common";
import { JapiError } from "ts-japi";
import { jsonApiPatchInputSchema } from "../zod";
import { errorMap } from "zod-validation-error";
import { ZodIssuesExeption } from "../zod/zod-issue.exception";
import { BaseSchema } from "../base-schema";
import { PipeMixinParams } from "../../controller/types";

export class JsonApiInputPatchPipe implements PipeTransform {
  schema: Type<BaseSchema<any>>;
  constructor(mixinParams: PipeMixinParams) {
    this.schema = mixinParams.schema;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schema) {
      throw new JapiError({
        status: 500,
        detail: `${this.schema.name}: Missing schema or updateSchema definition.`,
      });
    }

    if (metadata.type !== "body") {
      return value;
    }

    const result = await jsonApiPatchInputSchema(this.schema).safeParseAsync(
      value,
      { errorMap: errorMap },
    );

    if (result.success) {
      return result.data;
    }

    throw new ZodIssuesExeption(result.error);
  }
}
