import moleculer from 'moleculer';
import DbService from 'moleculer-db';
import PrismaDbAdapter from 'moleculer-db-adapter-prisma';
import { Action, Event, Method, Service } from 'typed-moleculer';

@Service({
    name: "likes",
    mixins: [DbService],
    adapter: new PrismaDbAdapter(),
    model: "Like",
    version: 2,
})
class LikesServicev2 extends moleculer.Service {
    settings = {
        fields: ["post", "user"],
        populates: {
            user: {
                field: "userId",
                action: "users.get",
                params: {
                    fields: ["username"]
                }
            },
            post: {
                field: "postId",
                action: "posts.get",
                params: {
                    fields: ["content", "id", "title"]
                }
            }
        }
    }

    @Action({
        params: {
            postId: "string"
        }
    })
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async create(ctx: any) {
        const { postId } = ctx.params;
 
        const doc = await this.adapter.insert({
            postId,
            userId: ctx.meta.user.id
        });

        return this.transformDocuments(ctx, {}, doc);
    }
}

export default LikesServicev2;