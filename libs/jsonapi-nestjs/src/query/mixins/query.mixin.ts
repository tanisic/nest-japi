import { PipeMixin } from "../../controller/types";
import { QueryPipe } from "../pipes/query.pipe";

export const queryMixin: PipeMixin = (schema) => {
  return new QueryPipe();
};
