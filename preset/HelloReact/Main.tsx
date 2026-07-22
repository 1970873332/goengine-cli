import { DocumentUtils } from "@/package/goengine-core/temporary/util/Document";
import RouterComponent from "@r/react/router/Router";
import "@r/web/css/index.css";
import { createElement, ReactElement } from "react";
import { createRoot, Root } from "react-dom/client";
import Config from "./router/Index";

export const root: Root = createRoot(DocumentUtils.rootWrap);

export const ReactRouter: ReactElement = createElement(RouterComponent, {
    config: Config,
});

root.render(ReactRouter);
