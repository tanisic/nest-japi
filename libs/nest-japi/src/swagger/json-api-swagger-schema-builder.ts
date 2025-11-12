import { Type } from "@nestjs/common";
import {
  fullJsonApiResponseSchema,
  getResourceOptions,
  getSchemasFromResource,
  InferSchemas,
  jsonApiPatchInputSchema,
  jsonApiPostInputSchema,
} from "../schema";
import { JsonBaseController } from "../controller/base-controller";
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
import { JSONAPI_CONTENT_TYPE, PARAMS_RESOURCE_ID } from "../constants";
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
  patchOneResponseZodSchema() {
    return fullJsonApiResponseSchema(this.viewSchema, {
      hasIncludes: false,
      withPagination: false,
      dataArray: false,
      resourceMetaSchema: this.getMetaZodScheme("patchOne", "resource"),
      documentMetaSchema: this.getMetaZodScheme("patchOne", "document"),
    });
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
      status: 201,
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
      status: 201,
      content: {
        [JSONAPI_CONTENT_TYPE]: {
          schema: {
            $ref: getSchemaPath(ResponseDto),
          },
        },
      },
    })(this.resource, "patchOne", descriptor);
  }

  registerSchemas() {
    this.registerGetAllSwagger();
    this.registerGetOneSwagger();
    this.registerPostOneSwagger();
    this.registerPatchOneSwagger();
  }
}
