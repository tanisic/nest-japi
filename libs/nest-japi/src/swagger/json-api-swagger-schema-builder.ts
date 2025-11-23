import { Type } from "@nestjs/common";
import {
  CreateSchema,
  ExtractRelations,
  fullJsonApiResponseSchema,
  getRelationByName,
  getRelations,
  getResourceOptions,
  getSchemasFromResource,
  InferSchemas,
  jsonApiPatchInputSchema,
  jsonApiPatchRelationInputSchema,
  jsonApiPostInputSchema,
  UpdateSchema,
  ViewSchema,
} from "../schema";
import { JsonApiController } from "../controller/base-controller";
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
import { ResourceOptions } from "../decorators/resource.decorator";

export class JsonApiDtoBuilder<
  Resource extends JsonApiController,
  TSchemas extends InferSchemas<Resource> = InferSchemas<Resource>,
> {
  declare ViewSchema: ViewSchema<TSchemas>;
  declare CreateSchema: CreateSchema<TSchemas>;
  declare UpdateSchema: UpdateSchema<TSchemas>;

  readonly resourceOptions: ResourceOptions<any, TSchemas>;
  readonly resource: Type<Resource>;
  readonly resourceName: string;
  private schemas: TSchemas;

  constructor(resource: Type<Resource>) {
    this.resource = resource;
    this.resourceOptions = getResourceOptions(resource) as ResourceOptions<
      any,
      TSchemas
    >;
    this.schemas = getSchemasFromResource(resource) as TSchemas;
    this.resourceName = this.resource.name;
  }

  get viewSchema() {
    return this.schemas.schema as Type<typeof this.ViewSchema>;
  }

  get createSchema() {
    return (this.schemas.createSchema || this.schemas.schema) as Type<
      typeof this.CreateSchema
    >;
  }

  get updateSchema() {
    return (this.schemas.updateSchema || this.schemas.schema) as Type<
      typeof this.UpdateSchema
    >;
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

  patchRelationshipResponseZodSchema<
    RelationName extends keyof ExtractRelations<typeof this.UpdateSchema>,
  >(relName: RelationName) {
    return jsonApiPatchRelationInputSchema(this.updateSchema, relName).openapi({
      title: relName as string,
    });
  }

  patchRelationshipResponseDto<
    RelationName extends keyof ExtractRelations<typeof this.UpdateSchema>,
  >(relName: RelationName) {
    return namedClass(
      `${this.resourceName}_patchRelationship_${relName as string}_response`,
      createZodDto(this.patchRelationshipResponseZodSchema(relName)),
    );
  }

  getRelationshipResponseZodSchema<
    RelationName extends keyof ExtractRelations<typeof this.ViewSchema>,
  >(relName: RelationName) {
    return jsonApiPatchRelationInputSchema(this.viewSchema, relName).openapi({
      title: relName as string,
    });
  }

  getRelationshipResponseDto<
    RelationName extends keyof ExtractRelations<typeof this.ViewSchema>,
  >(relName: RelationName) {
    return namedClass(
      `${this.resourceName}_getRelationship_${relName as string}_response`,
      createZodDto(this.getRelationshipResponseZodSchema(relName)),
    );
  }

  getRelationshipDataResponseZodSchema<
    RelationName extends keyof ExtractRelations<typeof this.ViewSchema>,
  >(relName: RelationName) {
    const rel = getRelationByName(this.viewSchema, relName);

    if (!rel) {
      throw new Error(
        `Relation with name ${relName as string} not found in resource ${this.resourceName}`,
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
export class JsonApiSwaggerSchemasRegister<Resource extends JsonApiController> {
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
      const relDto = this.dtoBuilder.getRelationshipResponseDto(rel.name);
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
      const relDto = this.dtoBuilder.patchRelationshipResponseDto(rel.name);
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
