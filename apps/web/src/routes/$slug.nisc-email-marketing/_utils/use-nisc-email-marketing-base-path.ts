import { useParams } from "react-router";

/** Customer routes: `/{teamSlug}/nisc-email-marketing/...` */
export function useNiscEmailMarketingBasePath() {
	const params = useParams();
	const teamSlug = typeof params.slug === "string" ? params.slug : "";
	const basePath = `/${teamSlug}/nisc-email-marketing`;
	return { teamSlug, basePath };
}
