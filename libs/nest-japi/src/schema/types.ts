import { Type } from "@nestjs/common";
import { BaseSchema } from "./base-schema";
import { EntityClass } from "@mikro-orm/core";

export type SchemaTypes = "createSchema" | "updateSchema" | "schema";

export type Schemas = {
  createSchema?: Type<BaseSchema<any>>;
  updateSchema?: Type<BaseSchema<any>>;
  schema: Type<BaseSchema<any>>;
};

export type Entities = {
  createEntity?: Type<EntityClass<any>>;
  updateEntity?: Type<EntityClass<any>>;
  viewEntity: Type<EntityClass<any>>;
};
