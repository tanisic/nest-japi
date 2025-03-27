import { FactoryProvider } from "@nestjs/common";
import { CURRENT_SCHEMAS } from "../../constants";
import { Schemas } from "../../schema";
import { FilterService } from "../services/filter.service";
export const filterServiceProvider: FactoryProvider<FilterService> = {
  provide: FilterService,
  inject: [CURRENT_SCHEMAS],
  useFactory: (schemas: Schemas) => {
    return new FilterService(schemas.schema);
  },
};
