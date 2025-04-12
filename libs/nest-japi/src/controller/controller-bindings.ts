import { RequestMethod, Query, Param, Body, Req } from "@nestjs/common";
import { JsonBaseController } from "./base-controller";
import { BindingsConfig } from "./types";
import { PARAMS_RESOURCE_ID, PARAMS_RELATION_NAME } from "../constants";
import { QueryAllPipe } from "../query";
import { QueryOnePipe } from "../query/pipes/query-one.pipe";
import { getAll, postOne } from "../swagger";
import { getOne } from "../swagger/methods/get-one";
import { patchOne } from "../swagger/methods/patch-one";
import { inputPatchBodyMixin } from "../mixins/input-patch-body.mixin";
import { inputPostBodyMixin } from "../mixins/input-post-body.mixin";
import { inputRelationNameMixin } from "../mixins/input-relation-name.mixin";
import { JsonApiInputPatchRelationInterceptor } from "../schema/interceptors/input-patch-relation.interceptor";

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
    swaggerImplementation: postOne,
    pipes: [],
    parameters: [
      {
        decorator: Body,
        mixins: [inputPostBodyMixin],
      },
    ],
  },
  patchOne: {
    method: RequestMethod.PATCH,
    name: "patchOne",
    path: `:${PARAMS_RESOURCE_ID}`,
    schema: "updateSchema",
    implementation: JsonBaseController.prototype.patchOne,
    swaggerImplementation: patchOne,
    pipes: [],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        decorator: Body,
        mixins: [inputPatchBodyMixin],
      },
    ],
  },
  getRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "getRelationship",
    method: RequestMethod.GET,
    schema: "schema",
    implementation: JsonBaseController.prototype.getRelationship,
    pipes: [],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [inputRelationNameMixin],
      },
    ],
  },
  getRelationshipData: {
    path: `:${PARAMS_RESOURCE_ID}/:${PARAMS_RELATION_NAME}`,
    name: "getRelationshipData",
    method: RequestMethod.GET,
    schema: "schema",
    implementation: JsonBaseController.prototype.getRelationshipData,
    pipes: [],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [inputRelationNameMixin],
      },
    ],
  },
  patchRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "patchRelationship",
    method: RequestMethod.PATCH,
    schema: "updateSchema",
    implementation: JsonBaseController.prototype.patchRelationship,
    interceptors: [JsonApiInputPatchRelationInterceptor],
    parameters: [
      {
        property: PARAMS_RESOURCE_ID,
        decorator: Param,
        mixins: [],
      },
      {
        property: PARAMS_RELATION_NAME,
        decorator: Param,
        mixins: [inputRelationNameMixin],
      },
      {
        decorator: Body,
        mixins: [],
      },
    ],
  },
};
