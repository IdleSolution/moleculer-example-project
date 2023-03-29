import type { ServiceSchema } from "moleculer";
import type { ApiSettingsSchema } from "moleculer-web";
import ApiGateway from "moleculer-web";


const ApiService: ServiceSchema<ApiSettingsSchema> = {
	name: "api",
	mixins: [ApiGateway],

	settings: {
		port: process.env.PORT != null ? Number(process.env.PORT) : 3000,

		ip: "0.0.0.0",

		use: [],

		routes: [
			{
				path: "/api",

				whitelist: ["*.*", "v2.likes.*"],

				autoAliases: true,

				authorization: true,


				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB",
					},
					urlencoded: {
						extended: true,
						limit: "1MB",
					},
				},

				mappingPolicy: "all",

				logging: true,
			},
		],
	},

	methods: {
		async authorize(ctx, route, req) {
			let token;
			if(req.headers.authorization) {
				// eslint-disable-next-line prefer-destructuring
				token = req.headers.authorization.split(" ")[1];
			}
			let user;
			if (token) {
				try {
					user = await ctx.call("users.resolveToken", { token });
					if (user) {
						this.logger.info("Authenticated via JWT: ", user.username);
						ctx.meta.user = user;
						ctx.meta.token = token;
						ctx.meta.userId = user.id;
					}
				} catch (err) {
					// Ignored because we continue processing if user doesn't exists
				}
			}

			if(req.$action.auth === "public") {
				return;
			}

			if (!user) {
				throw new Error('Unauthorized');
			}
		}
	},
};

export default ApiService;
