import { describe, expect, it } from "vitest";
import { BaseSchema } from "../base-schema";
import { Attribute, Relation, Schema } from "../../decorators";
import { z } from "zod";
import { zodDataSchema } from "./common";

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
  @Attribute({ validate: z.string().optional() })
  lastName!: string;
  @Relation({ schema: () => PostSchema, many: true, required: false })
  posts!: PostSchema[];
  @Relation({ schema: () => UserSchema, many: false, required: false })
  boss!: UserSchema;
}

describe("Data schema", () => {
  it("Required id and type", () => {
    const response = {
      id: 1,
      type: "user",
    };
    expect(zodDataSchema(UserSchema).parse(response)).toMatchSnapshot({
      id: "1",
      type: "user",
    });
  });
  it("Throw error on wrong type", () => {
    const response = {
      id: 1,
      type: "wrong_type",
    };
    expect(() => zodDataSchema(UserSchema).parse(response)).toThrowError();
  });
});

describe("Attributes schema", () => {
  it("Required id and type", () => {
    const response = {
      id: 1,
      type: "user",
    };
    expect(zodDataSchema(UserSchema).parse(response)).toMatchSnapshot({
      id: "1",
      type: "user",
    });
  });
  it("Throw error on wrong type", () => {
    const response = {
      id: 1,
      type: "wrong_type",
    };
    expect(() => zodDataSchema(UserSchema).parse(response)).toThrowError();
  });
});
