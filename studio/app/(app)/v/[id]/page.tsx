import VideoView from "@/components/VideoView";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  return <VideoView id={(await params).id} />;
}
