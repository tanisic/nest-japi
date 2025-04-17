import { FactoryProvider } from "@nestjs/common";
import { CURRENT_SCHEMAS } from "../../constants";
import { Schemas } from "../../schema";
import { IncludeService } from "../services/include.service";

export const includeServiceProvider: FactoryProvider<IncludeService> = {
  provide: IncludeService,
  inject: [CURRENT_SCHEMAS],
  useFactory: (schemas: Schemas<any, any, any>) => {
    return new IncludeService(schemas.schema);
  },
};
