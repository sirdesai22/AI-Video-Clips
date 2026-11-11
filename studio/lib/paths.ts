import path from "node:path";

export const studioRoot = () => process.env.STUDIO_ROOT ?? process.cwd();
export const repoRoot = () => path.resolve(studioRoot(), "..");
export const dbPath = () => process.env.DB_PATH ?? path.join(studioRoot(), "data", "app.db");
export const videosDir = () => process.env.VIDEOS_DIR ?? path.join(studioRoot(), "videos");
export const videoDir = (id: string) => path.join(videosDir(), id);
export const projectDir = (id: string) => path.join(videoDir(id), "project");
export const rendersDir = (id: string) => path.join(projectDir(id), "renders");
export const skillsSource = () => path.join(repoRoot(), ".agents", "skills");
export const kokoroPython = () =>
  process.env.HYPERFRAMES_PYTHON ?? path.join(repoRoot(), ".venv-kokoro", "bin", "python");
export const promptsDir = () => path.join(studioRoot(), "prompts");
export const fixturesDir = () => path.join(studioRoot(), "tests", "fixtures");
