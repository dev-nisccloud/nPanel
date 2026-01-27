import { notFound } from "next/navigation";
import { fromWordPressDetailSlug, isWordPressDetailSlug } from "@/lib/wordpress-url-slug";
import { InvalidWordPressUrlPage } from "../_components/invalid-wordpress-url-page";
import { WordPressDetailPage } from "../_components/wordpress-detail-page";

interface WordPressDetailProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default async function WordPressDetail({ params }: WordPressDetailProps) {
  const { slug, id } = await params;
  if (!slug) notFound();

  const installationId = isWordPressDetailSlug(id)
    ? fromWordPressDetailSlug(id, slug)
    : null;

  if (installationId === null) {
    return <InvalidWordPressUrlPage teamSlug={slug} />;
  }
  return <WordPressDetailPage installationId={String(installationId)} />;
}
