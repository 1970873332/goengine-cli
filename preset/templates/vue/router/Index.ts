import RouteConfig, { RouteObject } from "@goengine/vue/src/router/Config";
import Hello from "../views/Hello.vue";

export default abstract class Route extends RouteConfig {
    public static get routes(): RouteObject[] {
        return [
            {
                path: "/",
                component: Hello,
            },
        ];
    }
}
