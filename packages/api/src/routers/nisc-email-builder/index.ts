import { router } from "../../trpc";
import { nebBrandRouter } from "./brand";
import { nebBrandKitRouter } from "./brand-kit";
import { nebChatRouter } from "./chat";
import { nebDesignRouter } from "./design";
import { nebMediaLibraryRouter } from "./media-library";

export const niscEmailBuilderRouter = router({
	design: nebDesignRouter,
	chat: nebChatRouter,
	brandKit: nebBrandKitRouter,
	brand: nebBrandRouter,
	mediaLibrary: nebMediaLibraryRouter,
});
