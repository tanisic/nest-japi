import { describe, expect, it } from "vitest";
import { BaseSchema } from "../../base-schema";
import { Attribute, Relation, Schema } from "../../../decorators";
import { z } from "zod";
import { jsonApiPatchInputSchema } from "./schema";

@Schema({ jsonapiType: "post", entity: class {} })
class PostSchema extends BaseSchema {
  @Attribute({ validate: z.string() })
  id!: string;
  @Attribute({ validate: z.string() })
  content!: string;
  @Attribute({ validate: z.string() })
  title!: string;
}

@Schema({ jsonapiType: "user", entity: class {} })
class UserSchema extends BaseSchema {
  @Attribute({ validate: z.string() })
  id!: string;
  @Attribute({ validate: z.string().optional() })
  firstName!: string;
  @Attribute({ validate: z.string().optional() })
  lastName!: string;
  @Relation({ schema: () => PostSchema, many: true, required: false })
  posts!: PostSchema[];
  @Relation({ schema: () => UserSchema, many: false, required: false })
  boss!: UserSchema;
}

describe("Input patch schema", () => {
  it("Invalid attributes type throw error", () => {
    const response = {
      data: {
        id: 1,
        type: "user",
        attributes: { firstName: 123, lastName: "test" },
      },
    };
    expect(() =>
      jsonApiPatchInputSchema(UserSchema).parse(response),
    ).toThrowError();
  });
  it("Missing required attributes throw error", () => {
    @Schema({ jsonapiType: "user", entity: class {} })
    class UserSchema extends BaseSchema {
      @Attribute({ validate: z.string() })
      id!: string;
      @Attribute({ validate: z.string() })
      firstName!: string;
      @Attribute({ validate: z.string().optional() })
      lastName!: string;
    }
    const response = {
      data: {
        id: 1,
        type: "user",
        attributes: { lastName: "test" },
      },
    };
    expect(() =>
      jsonApiPatchInputSchema(UserSchema).parse(response),
    ).toThrowError();
  });
  it("Valid attributes", () => {
    const response = {
      data: {
        id: 1,
        type: "user",
        attributes: { firstName: "test", lastName: "test" },
      },
    };
    expect(jsonApiPatchInputSchema(UserSchema).parse(response)).toMatchSnapshot(
      {
        data: {
          id: "1",
          type: "user",
          attributes: { firstName: "test", lastName: "test" },
        },
      },
    );
  });
  it("Strips unknown attributes", () => {
    const response = {
      data: {
        id: 1,
        type: "user",
        attributes: {
          firstName: "test",
          lastName: "test",
          test: 123,
          someOther: "test",
          someOtherEmail: "test@test.com",
        },
      },
    };
    expect(jsonApiPatchInputSchema(UserSchema).parse(response)).toMatchSnapshot(
      {
        data: {
          id: "1",
          type: "user",
          attributes: { firstName: "test", lastName: "test" },
        },
      },
    );
  });
  it("Update relations valid", () => {
    const response = {
      data: {
        id: 1,
        type: "user",
        relationships: {
          boss: { data: null },
          posts: { data: [] },
        },
      },
    };
    expect(jsonApiPatchInputSchema(UserSchema).parse(response)).toMatchSnapshot(
      {
        data: {
          id: "1",
          type: "user",
          relationships: {
            boss: { data: null },
            posts: { data: [] },
          },
        },
      },
    );
    const response1 = {
      data: {
        id: 1,
        type: "user",
        relationships: {
          boss: { data: { type: "user", id: 2 } },
          posts: { data: [{ type: "post", id: 1 }] },
        },
      },
    };
    expect(
      jsonApiPatchInputSchema(UserSchema).parse(response1),
    ).toMatchSnapshot({
      data: {
        id: "1",
        type: "user",
        relationships: {
          boss: { data: { type: "user", id: "2" } },
          posts: { data: [{ type: "post", id: "1" }] },
        },
      },
    });
  });
});
