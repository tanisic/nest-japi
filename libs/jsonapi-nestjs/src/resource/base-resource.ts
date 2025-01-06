import { JsonBaseController } from "../controller/base-controller";

export class BaseResource<
  IdType = string | number,
> extends JsonBaseController<IdType> {}
