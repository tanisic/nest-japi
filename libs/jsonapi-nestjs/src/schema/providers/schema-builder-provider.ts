import { FactoryProvider, Type } from "@nestjs/common";
import { SchemaBuilderService } from "../services/schema-builder.service";
import { CURRENT_SCHEMAS, SCHEMA_REPOSITORY } from "../../constants";
import { BaseSchema } from "../base-schema";
import type { Schemas } from "../types";

export const schemaBuilderServiceProvider: FactoryProvider<SchemaBuilderService> =
  {
    provide: SchemaBuilderService,
    inject: [SCHEMA_REPOSITORY, CURRENT_SCHEMAS],
    useFactory: (
      globalSchemaMap: Map<string, Type<BaseSchema<any>>>,
      schemas: Schemas,
    ) => {
      return new SchemaBuilderService(globalSchemaMap, schemas);
    },
  };
