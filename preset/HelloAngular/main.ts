import { bootstrapApplication } from "@angular/platform-browser";
import { router } from "@r/angular/router/Router";
import AppComponent from "./app.component";
import Route from "./router/Index";

bootstrapApplication(AppComponent, {
    providers: [router(Route)],
}).catch((err) => console.error(err));
