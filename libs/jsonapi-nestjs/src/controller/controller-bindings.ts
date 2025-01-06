import {
  RequestMethod,
  Query,
  Param,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { JsonBaseController } from "./base-controller";
import { BindingsConfig } from "./types";
import { PARAMS_RESOURCE_ID, PARAMS_RELATION_NAME } from "../constants";
import { QueryAllPipe } from "../query";
import { QueryOnePipe } from "../query/pipes/query-one.pipe";

export const controllerBindings: BindingsConfig = {
  getAll: {
    method: RequestMethod.GET,
    name: "getAll",
    path: "/",
    schema: "schema",
    implementation: JsonBaseController.prototype.getAll,
    pipes: [QueryAllPipe],
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
    schema: "schema",
    implementation: JsonBaseController.prototype.getOne,
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
  postRelationship: {
    path: `:${PARAMS_RESOURCE_ID}/relationships/:${PARAMS_RELATION_NAME}`,
    name: "postRelationship",
    method: RequestMethod.POST,
    schema: "createSchema",
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
    schema: "schema",
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
