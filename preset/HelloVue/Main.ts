import { DocumentUtils } from "@core/utils/Document";
import "@web/csss/index.css";
import { router } from "@web/router/vue/Router";
import { App as AppComponent, createApp } from "vue";
import { Router } from "vue-router";
import App from "./App.vue";
import RouteConfig from "./router/Index";

export const VueApp: AppComponent = createApp(App);

export const VueRouter: Router = router(RouteConfig);

VueApp.use(VueRouter);
VueApp.mount(DocumentUtils.rootWrap);
