import { BaseResource } from "../resource/base-resource";
import { MethodName } from "./types";

type RequestMethodeObject = { [k in MethodName]: (...arg: any[]) => any };

export class JsonBaseController<R extends BaseResource>
  implements RequestMethodeObject {}
