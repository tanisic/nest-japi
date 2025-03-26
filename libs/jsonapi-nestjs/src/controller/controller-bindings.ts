import { RequestMethod, Query, Param, Body, Req } from "@nestjs/common";
import { JsonBaseController } from "./base-controller";
import { BindingsConfig } from "./types";
import { PARAMS_RESOURCE_ID, PARAMS_RELATION_NAME } from "../constants";
import { QueryAllPipe } from "../query";
import { QueryOnePipe } from "../query/pipes/query-one.pipe";
import { JsonApiInputPostPipe } from "../schema";
import { JsonApiInputPatchPipe } from "../schema/pipes/input-patch.pipe";
import { getAll } from "../swagger";
import { getOne } from "../swagger/methods/get-one";

export const controllerBindings: BindingsConfig = {
  getAll: {
    method: RequestMethod.GET,
    name: "getAll",
    path: "/",
    schema: "schema",
    implementation: JsonBaseController.prototype.getAll,
    swaggerImplementation: getAll,
    pipes: [QueryAllPipe],
    parameters: [
      {
        decorator: Query,
        mixins: [],
      },
      {
        decorator: Req,
        mixins: [],
      },
    ],
  },
  getOne: {
    method: RequestMethod.GET,
    name: "getOne",
    path: `:${PARAMS_RESOURCE_ID}`,
    schema: "schema",
    implementation: JsonBaseController.prototype.getOne,
    swaggerImplementation: getOne,
    pipes: [QueryOnePipe],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        decorator: Query,
        mixins: [],
      },
    ],
  },
  deleteOne: {
    method: RequestMethod.DELETE,
    name: "deleteOne",
    path: `:${PARAMS_RESOURCE_ID}`,
    schema: "schema",
    implementation: JsonBaseController.prototype.deleteOne,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
    ],
  },
  postOne: {
    method: RequestMethod.POST,
    name: "postOne",
    path: "/",
    schema: "createSchema",
    implementation: JsonBaseController.prototype.postOne,
    pipes: [JsonApiInputPostPipe],
    parameters: [
      {
        decorator: Body,
        mixins: [],
      },
    ],
  },
  patchOne: {
    method: RequestMethod.PATCH,
    name: "patchOne",
    path: `:${PARAMS_RESOURCE_ID}`,
    schema: "updateSchema",
    implementation: JsonBaseController.prototype.patchOne,
    pipes: [JsonApiInputPatchPipe],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        decorator: Body,
        mixins: [],
      },
    ],
  },
  getRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "getRelationship",
    method: RequestMethod.GET,
    schema: "schema",
    implementation: JsonBaseController.prototype.getRelationship,
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [],
      },
    ],
  },
  patchRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "patchRelationship",
    method: RequestMethod.PATCH,
    schema: "updateSchema",
    implementation: JsonBaseController.prototype["patchRelationship"],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [],
      },
      {
        decorator: Body,
        mixins: [],
      },
    ],
  },
};
