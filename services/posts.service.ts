import type { Context, Service, ServiceSchema } from "moleculer";
import DbService from "moleculer-db";
import type { DbAdapter, DbServiceSettings , MoleculerDbMethods } from "moleculer-db";
import PrismaDbAdapter from "moleculer-db-adapter-prisma";

type PostsSettings = DbServiceSettings;

interface PostsThis extends Service<PostsSettings>, MoleculerDbMethods {
	adapter: DbAdapter | PrismaDbAdapter;
}

export interface PostStatusParams {
	id: string;
}

interface PostEntity {
	id: string;
	title: string;
    content: string;
}

interface ContextMeta {
    user: {
        id: number,
    }
}

type ActionCreateParams = Pick<PostEntity, "title" | "content">

const PostsService: ServiceSchema<PostsSettings> = {
    name: "posts",
    mixins: [DbService],
    adapter: new PrismaDbAdapter(),
    model: "post",
    
    settings: {
        idField: "id",
		fields: ["id", "title", "content", "createdAt", "author"],
        populates: {
            async author(ids, posts, rule, ctx) {
                const users: {rows: {id: string, username: string}[]} = await ctx.call('users.list');
                posts.forEach(post => {
                    const foundUser = users.rows.find(user => user.id === post.authorId);
                    // eslint-disable-next-line no-param-reassign
                    post.author = foundUser;
                })
            }
        },
        entityValidator: {
            title: { type: "string", min: 1 },
			content: { type: "string", min: 1 },
        }
	},

    actions: {
        create: {
            rest: "POST /",
            params: {
                title: { type: "string", min: 1 },
                content: { type: "string", min: 1 },
            },
            async handler(this: PostsThis, ctx: Context<ActionCreateParams, ContextMeta>) {
                const { title, content } = ctx.params;

                const doc = await this.adapter.insert({
                    title,
                    content,
                    authorId: ctx.meta.user.id
                });

                return this.transformDocuments(ctx, {}, doc);
            }
        },
        list: {
            auth: "public"
        }
    },
}

export default PostsService;