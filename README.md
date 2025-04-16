# nest-japi

**nest-japi** is a plugin for [NestJS](https://nestjs.com/) (Express platform only) that lets you build fully compliant [JSON:API v1.1](https://jsonapi.org/) services with minimal boilerplate. It combines powerful technologies like [Zod](https://www.npmjs.com/package/zod), [MikroORM](https://www.npmjs.com/package/mikro-orm), [ts-japi](https://www.npmjs.com/package/ts-japi), and [@anatine/zod-openapi](https://www.npmjs.com/package/@anatine/zod-openapi) to create elegant and maintainable APIs.

---

## ✨ Features

- ⚙️ **Plug-and-play NestJS integration** (requires Express platform)
- 📄 **JSON:API compliant** controllers, routes, payloads, and relationships
- 🔐 **Zod-based schema validation** with full TypeScript support
- 📘 **Zod → OpenAPI** generation via [`anatine/zod-openapi`](https://www.npmjs.com/package/@anatine/zod-openapi)
- 📦 **JSON:API serialization** using [`ts-japi`](https://www.npmjs.com/package/ts-japi)
- 🔗 **Automatic controller and route generation** for all standard JSON:API endpoints
- 🧬 **Attribute and Relation decorators** directly map class properties to JSON:API `attributes` and `relationships`
- 🗃️ **MikroORM required** as the data persistence layer
- 📚 **Swagger UI support** with auto-generated schemas

---

## ⚠️ Requirements

- [NestJS](https://nestjs.com/) (Express platform only)
- [MikroORM](https://www.npmjs.com/package/mikro-orm) (**required**)
- [Zod](https://www.npmjs.com/package/zod)
- Each JSON:API resource must define:
  - A MikroORM Entity
  - A corresponding `@Schema()` class

---

## 📦 Installation

```bash
npm install nest-japi zod
```
## 🧠 Concepts

Every JSON:API resource must have:

- ✅ A MikroORM entity

- ✅ A schema class using @Schema decorator

If a type is referenced (e.g. as a relationship), its resource must be defined as well.

## 📐 Schema Definition

Use `@Attribute()` and `@Relation()` to define how fields and relationships appear in your API.

Example schema
```ts
import { Schema, Attribute, Relation, BaseSchema } from 'nest-japi';
import { z } from 'zod';
import { Post } from '../entities/post.entity';
import { CommentSchema } from './comment.schema';
import { UserSchema } from './user.schema';

@Schema({ jsonapiType: 'post', entity: Post })
export class PostSchema extends BaseSchema<Post> {
  @Attribute({ validate: z.number() })
  id: number;

  @Relation({ schema: () => CommentSchema, many: true, required: false })
  comments: CommentSchema[];

  @Attribute({ validate: z.date().optional() })
  createdAt: Date;

  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;

  @Attribute({ validate: z.string() })
  title: string;

  @Attribute({ validate: z.string() })
  content: string;

  @Relation({ schema: () => UserSchema, required: true })
  author: UserSchema;
}
```

### 🧠 How It Works

`@Schema()` binds the resource to its MikroORM entity and JSON:API type

`@Attribute()` fields are validated with Zod and exposed as JSON:API attributes

`@Relation()` defines JSON:API relationships

Validation schemas also generate OpenAPI docs via `@anatine/zod-openapi`

## ⚙️ Setup

To set up the JsonApiModule in your NestJS application, you need to use the following configuration:

- `JsonApiModule.forRoot()` - This method should be called in the AppModule to globally configure the module.

- `JsonApiModule.forFeature()` - This method is used in your feature modules (e.g., PostModule, UserModule, etc.) to register specific features that should be available to that module.

Here’s how you can integrate both into your application.

1. Setting up `JsonApiModule.forRoot()` in AppModule
In your AppModule, you should use `JsonApiModule.forRoot()` to configure the global settings for nest-japi.

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { JsonApiModule } from 'nest-japi';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    JsonApiModule.forRoot({
      ...
    }),
    PostModule,  // Example of a feature module
    UserModule,  // Another example of a feature module
  ],
})
export class AppModule {}
```


2. Setting up `JsonApiModule.forFeature()` in Feature Modules
In each feature module, you’ll use `JsonApiModule.forFeature()` to register specific JSON:API resource.

For instance, in the PostModule, you will register your post-related features:

```ts
// post.module.ts
import { Module } from '@nestjs/common';
import { JsonApiModule } from 'nest-japi';
import { PostResource } from './post.controller';

@Module({
  imports: [
    JsonApiModule.forFeature({
      resource: [PostResource], // Register the PostResource
    }),
  ],
  controllers: [PostController],
})
export class PostModule {}
```

Here, PostResource will be a controller responsible for handling JSON:API routes.

3. Example PostController using JSON:API Resource Controller
You can create a controller like this in your PostController:

```ts
// post.controller.ts
import { Resource } from 'nest-japi';
import { BaseResource } from 'src/resource/BaseResource';
import { CreatePostSchema, PostSchema, UpdatePostSchema } from 'src/posts/posts.schema';

@Resource({
  schemas: {
    schema: PostSchema,
    createSchema: CreatePostSchema,
    updateSchema: UpdatePostSchema,
  },
  disabledMethods: ["getOne"] // Disable getOne method
  path: 'v1/posts',
})
export class PostResource extends BaseResource<
  string,
  PostSchema,
  CreatePostSchema,
  PatchPostSchema
> {

    override getAll(
    query: QueryParams,
    request: Request,
  ): Promise<Partial<DataDocument<any>>> {
    return super.getAll(query, request);
  }

  @ApiOperation({
    description: 'test123', // Write own OpenAPI docs
  })
  override patchOne(id: string, body: PatchBody<PatchPostSchema>) {
    return super.patchOne(id, body);
  }
}
```
4. Example `PostSchema`

```ts
import { Schema, Attribute, Relation, BaseSchema } from 'nest-japi';
import { z } from 'zod';
import { Post } from '../entities/post.entity';
import { CommentSchema } from './comment.schema';
import { UserSchema } from './user.schema';

@Schema({ jsonapiType: 'post', entity: Post }) // Bind JSON:API type 'post' and MikroORM entity Post
export class PostSchema extends BaseSchema<Post> {
  @Attribute({ validate: z.number() })
  id: number;

  @Relation({ schema: () => CommentSchema, many: true, required: false })
  comments: CommentSchema[];

  @Attribute({ validate: z.date().optional() })
  createdAt: Date;

  @Attribute({ validate: z.date().optional() })
  updatedAt: Date;

  @Attribute({ validate: z.string() })
  title: string;

  @Attribute({ validate: z.string() })
  content: string;

  @Relation({ schema: () => UserSchema, required: true })
  author: User;
}
```

### ⚠️ Required steps for NestJS 11+
#### 🧠 Why is this needed?
In Express v5, query parameters are no longer parsed using the `qs` library by default.
Instead, Express uses a simple parser that does not support nested objects or arrays — which breaks compatibility with current query parse implementation.

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.set('query parser', 'extended'); // ✅ Required
await app.listen(3000);
```