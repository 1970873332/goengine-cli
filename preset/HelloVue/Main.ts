import { DocumentUtils } from "@r/core/util/temp/Document.js";
import { router } from "@r/vue/router/Router";
import "@r/web/css/index.css";
import { App as AppComponent, createApp } from "vue";
import { Router } from "vue-router";
import App from "./App.vue";
import Config from "./router/Index";

export const VueApp: AppComponent = createApp(App);

export const VueRouter: Router = router(Config);

VueApp.use(VueRouter);
VueApp.mount(DocumentUtils.rootWrap);
