import { describe, expect, it } from "vitest";
import { BaseSchema } from "../../base-schema";
import { Attribute, Relation, Schema } from "../../../decorators";
import { z, ZodObject } from "zod";
import { jsonApiPatchRelationInputSchema } from "./schema";
import { NotFoundException } from "@nestjs/common";

@Schema({ jsonapiType: "post", entity: class {} })
class PostSchema extends BaseSchema {
  @Attribute({ validate: z.string() })
  id: string;
  @Attribute({ validate: z.string() })
  content!: string;
  @Attribute({ validate: z.string() })
  title!: string;
}

@Schema({ jsonapiType: "user", entity: class {} })
class UserSchema extends BaseSchema {
  @Attribute({ validate: z.string() })
  id: string;
  @Attribute({ validate: z.string() })
  firstName!: string;
  @Attribute({ validate: z.string() })
  lastName!: string;
  @Relation({ schema: () => PostSchema, many: true })
  posts!: PostSchema[];
  @Relation({ schema: () => UserSchema, many: false, required: false })
  boss!: UserSchema;
}

describe("Input patch relation schema", () => {
  it("Valid relation name", () => {
    expect(jsonApiPatchRelationInputSchema(UserSchema, "posts")).toBeInstanceOf(
      ZodObject,
    );
    expect(jsonApiPatchRelationInputSchema(UserSchema, "boss")).toBeInstanceOf(
      ZodObject,
    );
  });
  it("Invalid relation name throws error", () => {
    expect(() =>
      jsonApiPatchRelationInputSchema(UserSchema, "unknown_relation"),
    ).toThrow(NotFoundException);
  });
  it("Invalid data type sent throws error", () => {
    const response1 = {
      data: { type: "post", id: 1 },
    };
    expect(() =>
      jsonApiPatchRelationInputSchema(UserSchema, "posts").parse(response1),
    ).toThrowError();

    const response2 = {
      data: null,
    };
    expect(() =>
      jsonApiPatchRelationInputSchema(UserSchema, "posts").parse(response2),
    ).toThrowError();
  });
  it("Valid to many relation update", () => {
    const response = {
      data: [{ type: "post", id: 1 }],
    };
    expect(
      jsonApiPatchRelationInputSchema(UserSchema, "posts").parse(response),
    ).toMatchSnapshot({ data: [{ type: "post", id: "1" }] });
  });
  it("Valid belongs to relation update", () => {
    const response1 = {
      data: { type: "user", id: 2 },
    };
    expect(
      jsonApiPatchRelationInputSchema(UserSchema, "boss").parse(response1),
    ).toMatchSnapshot({ data: { type: "user", id: "2" } });
    const response2 = {
      data: null,
    };
    expect(
      jsonApiPatchRelationInputSchema(UserSchema, "boss").parse(response2),
    ).toMatchSnapshot({ data: null });
  });
});
