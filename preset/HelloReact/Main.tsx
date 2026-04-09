import { DocumentUtils } from "@core/utils/Document";
import RouterComponent from "@react/router/Router";
import "@web/css/index.css";
import { createElement, ReactElement } from "react";
import { createRoot, Root } from "react-dom/client";
import Config from "./router/Index";

export const root: Root = createRoot(DocumentUtils.rootWrap);

export const ReactRouter: ReactElement = createElement(RouterComponent, {
    config: Config,
});

root.render(ReactRouter);
