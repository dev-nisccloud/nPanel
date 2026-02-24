import { WordPressDetailPage } from "../_components/wordpress-detail-page";

interface WordPressDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WordPressDetail({ params }: WordPressDetailProps) {
  const { id } = await params;
  return <WordPressDetailPage installationId={id} />;
}
