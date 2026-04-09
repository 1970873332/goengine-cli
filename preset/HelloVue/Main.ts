import { DocumentUtils } from "@core/utils/Document";
import { router } from "@vuee/router/Router";
import "@web/css/index.css";
import { App as AppComponent, createApp } from "vue";
import { Router } from "vue-router";
import App from "./App.vue";
import Config from "./router/Index";

export const VueApp: AppComponent = createApp(App);

export const VueRouter: Router = router(Config);

VueApp.use(VueRouter);
VueApp.mount(DocumentUtils.rootWrap);
