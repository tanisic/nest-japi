import { FactoryProvider } from "@nestjs/common";
import { CURRENT_SCHEMAS } from "../../constants";
import { Schemas } from "../../schema";
import { SortService } from "../services/sort.service";

export const sortServiceProvider: FactoryProvider<SortService> = {
  provide: SortService,
  inject: [CURRENT_SCHEMAS],
  useFactory: (schemas: Schemas<any, any, any>) => {
    return new SortService(schemas.schema);
  },
};
