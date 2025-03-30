import { PipeMixin } from "../controller/types";
import { JsonApiInputPatchPipe } from "../schema";

export const inputPatchBodyMixin: PipeMixin = (params) =>
  new JsonApiInputPatchPipe(params);
