import { trpc } from "@/utils/trpc";

type Utils = ReturnType<typeof trpc.useUtils>;

function booleanFields(vars: object) {
  return Object.fromEntries(
    Object.entries(vars).filter(
      ([key, value]) => key !== "installationId" && typeof value === "boolean",
    ),
  ) as Record<string, boolean>;
}

export function wpInstallationFields(
  utils: Utils,
  installationId: number,
  path: string[],
) {
  const input = { id: installationId };

  const rollback = (ctx?: { prev?: unknown }) => {
    if (ctx?.prev !== undefined) {
      utils.plesk.wordpress.getById.setData(input, ctx.prev as never);
    }
  };

  return {
    rollback,
    onMutate: async (vars: object) => {
      const fields = booleanFields(vars);
      if (Object.keys(fields).length === 0) return {};
      await utils.plesk.wordpress.getById.cancel(input);
      const prev = utils.plesk.wordpress.getById.getData(input);
      utils.plesk.wordpress.getById.setData(input, (old) => {
        if (!old?.data?.features) return old;
        const next = structuredClone(old);
        let node: Record<string, unknown> = next.data.features as Record<string, unknown>;
        for (const key of path) {
          if (!node[key] || typeof node[key] !== "object") node[key] = {};
          node = node[key] as Record<string, unknown>;
        }
        Object.assign(node, fields);
        return next;
      });
      return { prev };
    },
  };
}

export function wpDebugSettingsFields(utils: Utils, installationId: number) {
  const input = { installationId };

  const rollback = (ctx?: { prev?: unknown }) => {
    if (ctx?.prev !== undefined) {
      utils.plesk.wpFeatures.getDebugSettings.setData(input, ctx.prev as never);
    }
  };

  return {
    rollback,
    onMutate: async (vars: object) => {
      const fields = booleanFields(vars);
      if (Object.keys(fields).length === 0) return {};
      await utils.plesk.wpFeatures.getDebugSettings.cancel(input);
      const prev = utils.plesk.wpFeatures.getDebugSettings.getData(input);
      utils.plesk.wpFeatures.getDebugSettings.setData(input, (old) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, ...fields } };
      });
      return { prev };
    },
  };
}

export function wpCronMetaFields(utils: Utils, installationId: number) {
  const installation = wpInstallationFields(utils, installationId, ["wpCronTakeover"]);
  const input = { installationId };

  return {
    rollback: (ctx?: { prev?: unknown; prevCron?: unknown }) => {
      installation.rollback(ctx);
      if (ctx?.prevCron !== undefined) {
        utils.plesk.wpFeatures.getWpCronTakeoverMeta.setData(input, ctx.prevCron as never);
      }
    },
    onMutate: async (vars: object) => {
      const fields = booleanFields(vars);
      const { prev } = (await installation.onMutate(vars)) ?? {};
      await utils.plesk.wpFeatures.getWpCronTakeoverMeta.cancel(input);
      const prevCron = utils.plesk.wpFeatures.getWpCronTakeoverMeta.getData(input);
      utils.plesk.wpFeatures.getWpCronTakeoverMeta.setData(input, (old) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, ...fields } };
      });
      return { prev, prevCron };
    },
  };
}
