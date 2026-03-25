import { flatRoutes } from "@react-router/fs-routes";
import util from "node:util";

const routes = flatRoutes();
console.log(util.inspect(routes, { depth: null, colors: true }));
