import { PipeMixin } from "../controller/types";
import { JsonApiInputPostPipe } from "../schema";

export const inputPostBodyMixin: PipeMixin = (params) =>
  new JsonApiInputPostPipe(params);
