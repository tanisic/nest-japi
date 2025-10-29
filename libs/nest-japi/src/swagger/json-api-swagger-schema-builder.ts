import { Type } from "@nestjs/common";
import {
  fullJsonApiResponseSchema,
  getResourceOptions,
  getSchemasFromResource,
  InferSchemas,
} from "../schema";
import { JsonBaseController } from "../controller/base-controller";
import { ResourceOptions } from "../decorators";
import { namedClass } from "../helpers";
import { createZodDto } from "@anatine/zod-nestjs";
import { MethodName } from "../controller/types";
import { AnyZodObject } from "zod";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { JSONAPI_CONTENT_TYPE } from "../constants";
import {
  registerFilterQueryParamsSwaggerSchema,
  registerIncludesQueryParamsSwaggerSchema,
  registerPaginationQueryParamsSwaggerSchema,
  registerSortQueryParamsSwaggerSchema,
  registerSparseFieldsSwaggerSchema,
} from "./common";

export class JsonApiDtoBuilder<Resource extends JsonBaseController> {
  protected readonly viewSchema: Type<InferSchemas<Resource>["ViewSchema"]>;
  protected readonly createSchema: Type<InferSchemas<Resource>["CreateSchema"]>;
  protected readonly updateSchema: Type<InferSchemas<Resource>["UpdateSchema"]>;
  protected readonly resourceOptions: ResourceOptions;
  protected readonly resource: Type<Resource>;
  protected readonly resourceName: string;

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

  getAllResponseDto() {
    return namedClass(
      `${this.resourceName}_getAll_response`,
      createZodDto(this.getAllResponseZodSchema()),
    );
  }
}

export class JsonApiSwaggerSchemasRegister<
  Resource extends JsonBaseController,
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

  registerSchemas() {
    this.registerGetAllSwagger();
  }
}
