import { DocumentUtils } from "@goengine/core/experimental/util/Document";
import { router } from "@goengine/vue/src/router/Router";
import "@goengine/web/src/css/index.css";
import { App as AppComponent, createApp } from "vue";
import { Router } from "vue-router";
import App from "./views/App.vue";
import Config from "./router/Index";

export const VueApp: AppComponent = createApp(App);

export const VueRouter: Router = router(Config);

VueApp.use(VueRouter);
VueApp.mount(DocumentUtils.rootWrap);
