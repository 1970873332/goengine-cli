import RouteConfig, { RouteObject } from "@angularr/router/Config";
import HelloComponent from "../views/hello/index.component";

export default abstract class Route extends RouteConfig {
    public static get routes(): RouteObject[] {
        return [
            {
                path: "",
                component: HelloComponent,
            },
        ];
    }
}
