import { RequestMethod, Query, Param, Body } from "@nestjs/common";
import { JsonBaseController } from "./base-controller";
import { BindingsConfig } from "./types";
import { PARAMS_RESOURCE_ID, PARAMS_RELATION_NAME } from "../constants";

export const controllerBindings: BindingsConfig = {
  getAll: {
    method: RequestMethod.GET,
    name: "getAll",
    path: "/",
    implementation: JsonBaseController.prototype.getAll,
    parameters: [
      {
        decorator: Query,
        mixins: [],
      },
    ],
  },
  getOne: {
    method: RequestMethod.GET,
    name: "getOne",
    path: `:${PARAMS_RESOURCE_ID}`,
    implementation: JsonBaseController.prototype.getOne,
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
    implementation: JsonBaseController.prototype.postOne,
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
    implementation: JsonBaseController.prototype.patchOne,
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
  postRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "postRelationship",
    method: RequestMethod.POST,
    implementation: JsonBaseController.prototype["postRelationship"],
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
  deleteRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "deleteRelationship",
    method: RequestMethod.DELETE,
    implementation: JsonBaseController.prototype["deleteRelationship"],
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
  patchRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "patchRelationship",
    method: RequestMethod.PATCH,
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
