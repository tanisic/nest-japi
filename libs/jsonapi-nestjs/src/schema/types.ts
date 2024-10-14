import { Type } from "@nestjs/common";
import { BaseSchema } from "./base-schema";

export type SchemaTypes = "createSchema" | "updateSchema" | "schema";

export type Schemas = {
  createSchema?: Type<BaseSchema<any>>;
  updateSchema?: Type<BaseSchema<any>>;
  schema: Type<BaseSchema<any>>;
};
