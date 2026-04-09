import { RouteConfig, RouteObject } from "@react/router/Config";
import Hello from "../views/Hello";

export default abstract class Route extends RouteConfig {
    public static get routes(): RouteObject[] {
        return [
            {
                path: "/",
                element: <Hello />,
            },
        ];
    }
}
