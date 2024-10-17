import { FactoryProvider } from "@nestjs/common";
import { SparseFieldsService } from "..";
import { JsonApiOptions } from "../../modules/json-api-options";

export const sparseFieldsServiceProvider: FactoryProvider<SparseFieldsService> =
  {
    provide: SparseFieldsService,
    inject: [JsonApiOptions],
    useFactory: (options: JsonApiOptions) => {
      return new SparseFieldsService(options);
    },
  };
