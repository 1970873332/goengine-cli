import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withHashLocation } from "@angular/router";
import AppComponent from "./views/app.component";
import { routes } from "./router/Index";

bootstrapApplication(AppComponent, {
    /* hash 路由：支持 LiveServer 直开 html / file://（Electron 打包）加载 */
    providers: [provideRouter(routes, withHashLocation())],
}).catch((err) => console.error(err));
