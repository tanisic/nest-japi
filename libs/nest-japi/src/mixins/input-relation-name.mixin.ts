import { PipeMixin } from "../controller/types";
import { JsonApiInputRelationsParamPipe } from "../schema";

export const inputRelationNameMixin: PipeMixin = (params) =>
  new JsonApiInputRelationsParamPipe(params);
