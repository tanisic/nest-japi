import { FactoryProvider, Type } from "@nestjs/common";
import { SparseFieldsService } from "..";
import { SCHEMA_REPOSITORY } from "../../constants";
import { JsonApiSchema } from "../../schema";

export const sparseFieldsServiceProvider: FactoryProvider<SparseFieldsService> =
  {
    provide: SparseFieldsService,
    inject: [SCHEMA_REPOSITORY],
    useFactory: (globalMap: Map<string, Type<JsonApiSchema<any>>>) => {
      return new SparseFieldsService(globalMap);
    },
  };
