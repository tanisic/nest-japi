import {
  ArgumentMetadata,
  NotFoundException,
  PipeTransform,
  Type,
} from "@nestjs/common";
import { JsonApiSchema } from "../schema";
import { JapiError } from "ts-japi";
import { PipeMixinParams } from "../../controller/types";
import { getRelationByName } from "../helpers/schema-helper";
import { ExtractRelations } from "../types";

export class JsonApiInputRelationsParamPipe implements PipeTransform {
  schema: Type<JsonApiSchema<any>>;
  constructor(mixinParams: PipeMixinParams) {
    this.schema = mixinParams.schema;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!this.schema) {
      throw new JapiError({
        status: 500,
        detail: "Missing schema definition.",
      });
    }

    if (metadata.type !== "param") {
      return value;
    }

    const relName = value as keyof ExtractRelations<JsonApiSchema<any>>;

    const relation = getRelationByName(this.schema, relName);

    if (!relation) {
      throw new NotFoundException(
        `Relation "${relName}" does not exist on "${this.schema.name}" schema.`,
      );
    }

    return relName;
  }
}
