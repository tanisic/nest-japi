import { ArgumentMetadata, PipeTransform, Type } from "@nestjs/common";
import { JapiError } from "ts-japi";
import { jsonApiPostInputSchema } from "../zod";
import { errorMap } from "zod-validation-error";
import { ZodIssuesExeption } from "../zod/zod-issue.exception";
import { BaseSchema } from "../base-schema";
import { PipeMixinParams } from "../../controller/types";

export class JsonApiInputPostPipe implements PipeTransform {
  schema: Type<BaseSchema<any>>;
  constructor(mixinParams: PipeMixinParams) {
    this.schema = mixinParams.schema;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schema) {
      throw new JapiError({
        status: 500,
        detail: `${JsonApiInputPostPipe.name}: Missing createSchema definition.`,
      });
    }

    if (metadata.type !== "body") {
      return value;
    }

    const result = await jsonApiPostInputSchema(this.schema).safeParseAsync(
      value,
      {
        errorMap: errorMap,
      },
    );

    if (result.success) {
      return result.data;
    }

    throw new ZodIssuesExeption(result.error);
  }
}
