import { Type } from "@nestjs/common";
import {
  fullJsonApiResponseSchema,
  getRelationByName,
  getRelations,
  getResourceOptions,
  getSchemasFromResource,
  InferSchemas,
  jsonApiPatchInputSchema,
  jsonApiPatchRelationInputSchema,
  jsonApiPostInputSchema,
} from "../schema";
import { JsonApiBaseController } from "../controller/base-controller";
import { ResourceOptions } from "../decorators";
import { namedClass } from "../helpers";
import { createZodDto } from "@anatine/zod-nestjs";
import { MethodName } from "../controller/types";
import { AnyZodObject } from "zod";
import {
  ApiBody,
  ApiExtraModels,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import {
  JSONAPI_CONTENT_TYPE,
  PARAMS_RELATION_NAME,
  PARAMS_RESOURCE_ID,
} from "../constants";
import {
  registerFilterQueryParamsSwaggerSchema,
  registerIncludesQueryParamsSwaggerSchema,
  registerPaginationQueryParamsSwaggerSchema,
  registerSortQueryParamsSwaggerSchema,
  registerSparseFieldsSwaggerSchema,
} from "./common";

export class JsonApiDtoBuilder<Resource extends JsonApiBaseController> {
  readonly viewSchema: Type<InferSchemas<Resource>["ViewSchema"]>;
  readonly createSchema: Type<InferSchemas<Resource>["CreateSchema"]>;
  readonly updateSchema: Type<InferSchemas<Resource>["UpdateSchema"]>;
  readonly resourceOptions: ResourceOptions;
  readonly resource: Type<Resource>;
  readonly resourceName: string;

  constructor(resource: Type<Resource>) {
    this.resource = resource;
    const { schema, createSchema, updateSchema } =
      getSchemasFromResource(resource);
    this.viewSchema = schema;
    this.createSchema = createSchema || schema;
    this.updateSchema = updateSchema || schema;
    this.resourceOptions = getResourceOptions(resource) as ResourceOptions<
      any,
      any,
      any,
      any
    >;
    this.resourceName = this.resource.name;
  }

  private getMetaZodScheme(
    method: MethodName,
    type: "resource" | "document",
  ): AnyZodObject | undefined {
    return this.resourceOptions.metaSchemas?.[method]?.[type];
  }

  getAllResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: true,
      withPagination: true,
      resourceMetaSchema: this.getMetaZodScheme("getAll", "resource"),
      documentMetaSchema: this.getMetaZodScheme("getAll", "document"),
    });
  }

  postOneBodyZodSchema() {
    return jsonApiPostInputSchema(this.createSchema);
  }

  postOneResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: false,
      withPagination: false,
      dataArray: false,
      resourceMetaSchema: this.getMetaZodScheme("postOne", "resource"),
      documentMetaSchema: this.getMetaZodScheme("postOne", "document"),
    });
  }

  getOneResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: true,
      withPagination: false,
      dataArray: false,
      resourceMetaSchema: this.getMetaZodScheme("getOne", "resource"),
      documentMetaSchema: this.getMetaZodScheme("getOne", "document"),
    });
  }

  getOneResponseDto() {
    return namedClass(
      `${this.resourceName}_getOne_response`,
      createZodDto(this.getOneResponseZodSchema()),
    );
  }

  getAllResponseDto() {
    return namedClass(
      `${this.resourceName}_getAll_response`,
      createZodDto(this.getAllResponseZodSchema()),
    );
  }

  postOneBodyDto() {
    return namedClass(
      `${this.resourceName}_postOne_body`,
      createZodDto(this.postOneBodyZodSchema()),
    );
  }

  postOneResponseDto() {
    return namedClass(
      `${this.resourceName}_postOne_response`,
      createZodDto(this.postOneResponseZodSchema()),
    );
  }
  patchOneBodyDto() {
    return namedClass(
      `${this.resourceName}_patchOne_body`,
      createZodDto(this.patchOneBodyZodSchema()),
    );
  }
  patchOneBodyZodSchema() {
    return jsonApiPatchInputSchema(this.updateSchema);
  }

  patchOneResponseDto() {
    return namedClass(
      `${this.resourceName}_patchOne_response`,
      createZodDto(this.patchOneResponseZodSchema()),
    );
  }

  deleteOneResponseDto() {
    return namedClass(
      `${this.resourceName}_deleteOne_response`,
      createZodDto(this.patchOneResponseZodSchema()),
    );
  }
  patchOneResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: false,
      withPagination: false,
      dataArray: false,
      resourceMetaSchema: this.getMetaZodScheme("patchOne", "resource"),
      documentMetaSchema: this.getMetaZodScheme("patchOne", "document"),
    });
  }
  deleteOneResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: false,
      withPagination: false,
      dataArray: false,
      resourceMetaSchema: this.getMetaZodScheme("deleteOne", "resource"),
      documentMetaSchema: this.getMetaZodScheme("deleteOne", "document"),
    });
  }

  patchRelationshipResponseZodSchema(relName: string) {
    return jsonApiPatchRelationInputSchema(this.viewSchema, relName).openapi({
      title: relName,
    });
  }

  patchRelationshipResponseDto(relName: string) {
    return namedClass(
      `${this.resourceName}_patchRelationship_${relName}_response`,
      createZodDto(this.patchRelationshipResponseZodSchema(relName)),
    );
  }

  getRelationshipResponseZodSchema(relName: string) {
    return jsonApiPatchRelationInputSchema(this.viewSchema, relName).openapi({
      title: relName,
    });
  }

  getRelationshipResponseDto(relName: string) {
    return namedClass(
      `${this.resourceName}_getRelationship_${relName}_response`,
      createZodDto(this.getRelationshipResponseZodSchema(relName)),
    );
  }

  getRelationshipDataResponseZodSchema(relName: string) {
    const rel = getRelationByName(this.viewSchema, relName);

    if (!rel) {
      throw new Error(
        `Relation with name ${relName} not found in resource ${this.resourceName}`,
      );
    }

    return fullJsonApiResponseSchema(rel.schema(), {
      hasIncludes: false,
      withPagination: false,
      dataArray: rel.many,
      resourceMetaSchema: this.getMetaZodScheme(
        "getRelationshipData",
        "resource",
      ),
      documentMetaSchema: this.getMetaZodScheme(
        "getRelationshipData",
        "document",
      ),
    }).openapi({ title: rel.name as string });
  }

  getRelationshipDataResponseDto(relName: string) {
    return namedClass(
      `${this.resourceName}_getRelationshipData_${relName}_response`,
      createZodDto(this.getRelationshipDataResponseZodSchema(relName as any)),
    );
  }
}
export class JsonApiSwaggerSchemasRegister<
  Resource extends JsonApiBaseController,
> {
  dtoBuilder: JsonApiDtoBuilder<Resource>;

  constructor(protected resource: Type<Resource>) {
    this.dtoBuilder = new JsonApiDtoBuilder(resource);
  }
  private getMethodDescriptor(methodName: MethodName) {
    return Reflect.getOwnPropertyDescriptor(
      this.resource.prototype,
      methodName,
    )!;
  }

  private registerDto(dto: Type<any>) {
    ApiExtraModels(dto)(this.resource);
  }

  private registerGetAllSwagger() {
    const descriptor = this.getMethodDescriptor("getAll");
    const ResponseDto = this.dtoBuilder.getAllResponseDto();
    this.registerDto(ResponseDto);

    registerSparseFieldsSwaggerSchema({ resource: this.resource, descriptor });
    registerIncludesQueryParamsSwaggerSchema({
      resource: this.resource,
      descriptor,
    });
    registerPaginationQueryParamsSwaggerSchema({
      resource: this.resource,
      descriptor,
    });
    registerFilterQueryParamsSwaggerSchema({
      resource: this.resource,
      descriptor,
    });
    registerSortQueryParamsSwaggerSchema({
      resource: this.resource,
      descriptor,
    });

    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "getAll", descriptor);
  }
  private registerGetOneSwagger() {
    const descriptor = this.getMethodDescriptor("getOne");
    const ResponseDto = this.dtoBuilder.getOneResponseDto();
    this.registerDto(ResponseDto);

    registerIncludesQueryParamsSwaggerSchema({
      resource: this.resource,
      descriptor,
    });
    registerSparseFieldsSwaggerSchema({ resource: this.resource, descriptor });
    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "getOne",
      descriptor,
    );
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "getOne", descriptor);
  }

  private registerPostOneSwagger() {
    const descriptor = this.getMethodDescriptor("postOne");
    const ResponseDto = this.dtoBuilder.postOneResponseDto();
    this.registerDto(ResponseDto);
    const BodyDto = this.dtoBuilder.postOneBodyDto();
    this.registerDto(BodyDto);

    ApiBody({ schema: { $ref: getSchemaPath(BodyDto) } })(
      this.resource,
      "postOne",
      descriptor,
    );
    ApiResponse({
      status: 201,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "postOne", descriptor);
  }

  private registerPatchOneSwagger() {
    const descriptor = this.getMethodDescriptor("patchOne");
    const ResponseDto = this.dtoBuilder.patchOneResponseDto();
    this.registerDto(ResponseDto);
    const BodyDto = this.dtoBuilder.patchOneBodyDto();
    this.registerDto(BodyDto);

    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "patchOne",
      descriptor,
    );
    ApiBody({ schema: { $ref: getSchemaPath(BodyDto) } })(
      this.resource,
      "patchOne",
      descriptor,
    );
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "patchOne", descriptor);
  }

  private registerDeleteOneSwagger() {
    const descriptor = this.getMethodDescriptor("deleteOne");
    const ResponseDto = this.dtoBuilder.deleteOneResponseDto();
    this.registerDto(ResponseDto);

    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "deleteOne",
      descriptor,
    );
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "deleteOne", descriptor);
  }

  private registerGetRelationshipSwagger() {
    const descriptor = this.getMethodDescriptor("getRelationship");
    const relationResponseDtos: Type<any>[] = [];
    const relationships = getRelations(this.dtoBuilder.viewSchema);

    relationships.forEach((rel) => {
      const relDto = this.dtoBuilder.getRelationshipResponseDto(
        rel.name as string,
      );
      this.registerDto(relDto);
      relationResponseDtos.push(relDto);
    });

    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "getRelationship",
      descriptor,
    );
    ApiParam({
      name: PARAMS_RELATION_NAME,
      type: "string",
      enum: relationships.map((rel) => rel.name),
    })(this.resource, "getRelationship", descriptor);
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            oneOf: relationResponseDtos.map((dto) => ({
              $ref: getSchemaPath(dto),
            })),
          },
        },
      },
    })(this.resource, "getRelationship", descriptor);
  }
  private registerGetRelationshipDataSwagger() {
    const descriptor = this.getMethodDescriptor("getRelationshipData");
    const relationResponseDtos: Type<any>[] = [];
    const relationships = getRelations(this.dtoBuilder.viewSchema);

    relationships.forEach((rel) => {
      const relDto = this.dtoBuilder.getRelationshipDataResponseDto(
        rel.name as string,
      );
      this.registerDto(relDto);
      relationResponseDtos.push(relDto);
    });

    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "getRelationshipData",
      descriptor,
    );
    ApiParam({
      name: PARAMS_RELATION_NAME,
      type: "string",
      enum: relationships.map((rel) => rel.name),
    })(this.resource, "getRelationshipData", descriptor);
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            oneOf: relationResponseDtos.map((dto) => ({
              $ref: getSchemaPath(dto),
            })),
          },
        },
      },
    })(this.resource, "getRelationshipData", descriptor);
  }

  private registerPatchRelationshipSwagger() {
    const descriptor = this.getMethodDescriptor("patchRelationship");
    const relationResponseDtos: Type<any>[] = [];
    const relationships = getRelations(this.dtoBuilder.updateSchema);

    relationships.forEach((rel) => {
      const relDto = this.dtoBuilder.patchRelationshipResponseDto(
        rel.name as string,
      );
      this.registerDto(relDto);
      relationResponseDtos.push(relDto);
    });

    ApiParam({ name: PARAMS_RESOURCE_ID, type: "string" })(
      this.resource,
      "patchRelationship",
      descriptor,
    );
    ApiParam({
      name: PARAMS_RELATION_NAME,
      type: "string",
      enum: relationships.map((rel) => rel.name),
    })(this.resource, "patchRelationship", descriptor);
    ApiResponse({
      status: 200,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            oneOf: relationResponseDtos.map((dto) => ({
              $ref: getSchemaPath(dto),
            })),
          },
        },
      },
    })(this.resource, "patchRelationship", descriptor);
  }

  registerSchemas() {
    this.registerGetAllSwagger();
    this.registerGetOneSwagger();
    this.registerDeleteOneSwagger();
    this.registerPostOneSwagger();
    this.registerPatchOneSwagger();
    this.registerGetRelationshipSwagger();
    this.registerGetRelationshipDataSwagger();
    this.registerPatchRelationshipSwagger();
  }
}
