import { ReactRouteConfig, ReactRouteObject } from "@web/router/react/Config";
import Hello from "../views/Hello";

export default abstract class RouteConfig extends ReactRouteConfig {
    public static get routes(): ReactRouteObject[] {
        return [
            {
                path: "/",
                element: <Hello />,
            },
        ];
    }
}
