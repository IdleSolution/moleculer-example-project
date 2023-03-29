import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbAdapter, DbServiceSettings, MoleculerDbMethods } from "moleculer-db";
import DbService from "moleculer-db";
import PrismaDbAdapter from "moleculer-db-adapter-prisma";
 
 
interface LikesThis extends Service<DbServiceSettings>, MoleculerDbMethods {
    adapter: DbAdapter | PrismaDbAdapter;
}
 
 
interface LikesEntity {
    userId: string;
    postId: string;
}
 
interface ContextMeta {
    user: {
        id: number,
    }
}
 
type ActionCreateParams = Pick<LikesEntity, "postId">
 
const LikesService: ServiceSchema<DbServiceSettings> = {
    name: "likes",
    mixins: [DbService],
    adapter: new PrismaDbAdapter(),
    model: "Like",
 
    settings: {
        fields: ["user", "post"],
        populates: {
            "user": {
                field: "userId",
                action: "users.get",
                params: {
                    fields: ["username"]
                }
            },
            "post": {
                field: "postId",
                action: "posts.get",
                params: {
                    fields: ["content", "id", "title"]
                }
            }
        }
    },
 
    actions: {
        create: {
            rest: "POST /",
            params: {
                postId: { type: "string" }
            },
 
            async handler(this: LikesThis, ctx: Context<ActionCreateParams, ContextMeta>) {
                const { postId } = ctx.params;
 
                const doc = await this.adapter.insert({
                    postId,
                    userId: ctx.meta.user.id
                });
 
                return this.transformDocuments(ctx, {}, doc);
            }
        },
        delete: {
            rest: "DELETE /",
            params: {
                postId:  {type: "string" }
            },
 
            async handler(this: LikesThis, ctx: Context<ActionCreateParams, ContextMeta>) {
                const { postId } = ctx.params;
 
                return !!(await this.adapter.removeMany({postId}))
            }
        }
    }
}
 
export default LikesService;