import NewVideoForm from "@/components/NewVideoForm";
import RecentVideos from "@/components/RecentVideos";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl pt-4">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New video</h1>
      <NewVideoForm />
      <RecentVideos />
    </div>
  );
}
