import VueRouterConfig, { VueRouteObject } from "@web/router/vue/Config";
import Hello from "../views/Hello.vue";

export default abstract class RouteConfig extends VueRouterConfig {
    public static get routes(): VueRouteObject[] {
        return [
            {
                path: "/",
                component: Hello,
            },
        ];
    }
}
