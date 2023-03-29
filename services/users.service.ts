import bcrypt from 'bcryptjs'
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken"
import type { Context, Service, ServiceSchema } from "moleculer";
import type { DbAdapter, DbServiceSettings, MoleculerDbMethods } from "moleculer-db";
import DbService from "moleculer-db";
import PrismaDbAdapter from "moleculer-db-adapter-prisma";


type UsersSettings = DbServiceSettings & {
    JWT_SECRET: string,
};

interface UsersThis extends Service<UsersSettings>, MoleculerDbMethods {
	adapter: DbAdapter | PrismaDbAdapter;
}

interface UserEntity {
	id: string;
	username: string;
	password: string;
}

type ActionCreateParams = Pick<UserEntity, "username" | "password">


const UsersService: ServiceSchema<UsersSettings> = {
    name: "users",
    mixins: [DbService],
    adapter: new PrismaDbAdapter(),
    model: "User",

    settings: {
		idField: "id",
        JWT_SECRET: process.env.JWT_SECRET || "jwt-conduit-secret",
        fields: ["id", "username", "posts"],
		entityValidator: {
			username: { type: "string", min: 2 },
			password: { type: "string", min: 6 },
		},
    },

    actions: {
		create: {
			rest: "POST /",
			params: {
				username: { type: "string", min: 2 },
				password: { type: "string", min: 6 },
			},

			async handler(this: UsersThis, ctx: Context<ActionCreateParams>) {
				const { username, password } = ctx.params;

				const userExists = await this.adapter.findOne({username});
				if(userExists) {
					throw new Error('User with this username already exists!');
				}

				const hashedPassword = bcrypt.hashSync(password, 10);

				const doc = await this.adapter.insert({
					username,
					password: hashedPassword
				});

				const user = await this.transformDocuments(ctx, {}, doc);
				user.token = await this.generateJWT(user);
				await ctx.emit('user.created');

				return user;
			}
		},

		login: {
			rest: "POST /users/login",
			auth: 'public',
			params: {
				username: { type: "string", min: 2 },
				password: { type: "string", min: 6 },
			},

			async handler(ctx: Context<ActionCreateParams>) {
				const { username, password } = ctx.params;

				const user = await this.adapter.findOne({ username });
				if (!user) {
					throw new Error('User does not exist');
				}

				const res = await bcrypt.compare(password, user.password);
				if (!res) {
					throw new Error('Wrong password!');
				}

				const userToReturn = await this.transformDocuments(ctx, {}, user);
				userToReturn.token = await this.generateJWT(user);
				return userToReturn;
			}
		},

		resolveToken: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60
			},
			params: {
				token: "string"
			},
			handler(ctx) {
				const decodedUser = jwt.verify(ctx.params.token, this.settings.JWT_SECRET) as JwtPayload

				return this.getById(decodedUser.id);
			}
		},
    },
	
	methods: {
		generateJWT(user) {
			const today = new Date();
			const exp = new Date(today);
			exp.setDate(today.getDate() + 60);

			return jwt.sign({
				id: user.id,
				username: user.username,
				exp: Math.floor(exp.getTime() / 1000)
			}, this.settings.JWT_SECRET);
		},
	},

	events: {
		"user.created": {
			handler() {
				this.logger.info('New user created')
			}
		}
	}
}

export default UsersService;