import { DocumentUtils } from "@core/utils/Document";
import ReactRouterComponent from "@web/router/react/Router";
import "@web/csss/index.css";
import { createElement, ReactElement } from "react";
import { createRoot, Root } from "react-dom/client";
import RouteConfig from "./router/Index";

export const root: Root = createRoot(DocumentUtils.rootWrap);

export const ReactRouter: ReactElement = createElement(ReactRouterComponent, {
    config: RouteConfig,
});

root.render(ReactRouter);
