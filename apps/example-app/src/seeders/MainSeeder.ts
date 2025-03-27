import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Post } from 'src/entities/post.entity';
import { User } from 'src/entities/user.entity';
import { Comment } from 'src/entities/comment.entity';
import { faker } from '@faker-js/faker';
import { Address } from 'src/entities/address.entity';

export class MainSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const users: User[] = [];
    const posts: Post[] = [];
    const comments: Comment[] = [];
    const addresses: Address[] = [];

    // Generate 50 users
    for (let i = 0; i < 20; i++) {
      const user = em.create(User, {
        name: faker.name.fullName(),
        email: faker.internet.email(),
      });
      users.push(user);
      const address = em.create(Address, {
        user: user,
        city: faker.location.city(),
        street: faker.location.street(),
        country: faker.location.county(),
        streetNumber: faker.location.buildingNumber(),
      });
      addresses.push(address);
    }

    for (let i = 0; i < 100; i++) {
      const randomUser = faker.helpers.arrayElement(users); // Assign a random user to each post
      const post = em.create(Post, {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        author: randomUser,
      });
      posts.push(post);
    }

    for (let i = 0; i < 200; i++) {
      const randomUser = faker.helpers.arrayElement(users); // Assign a random user to each comment
      const randomPost = faker.helpers.arrayElement(posts); // Assign a random post to each comment
      const comment = em.create(Comment, {
        content: faker.lorem.sentences(2),
        author: randomUser,
        post: randomPost,
      });
      comments.push(comment);
    }

    // Persist all data to the database
    await em.persistAndFlush([...users, ...addresses, ...posts, ...comments]);
  }
}
