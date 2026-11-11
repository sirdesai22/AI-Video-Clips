import path from "node:path";

export const studioRoot = () => process.env.STUDIO_ROOT ?? process.cwd();
export const repoRoot = () => path.resolve(studioRoot(), "..");
export const dbPath = () => {
  const p = process.env.DB_PATH;
  return p === undefined ? path.join(studioRoot(), "data", "app.db") : p === ":memory:" ? p : path.resolve(p);
};
export const videosDir = () =>
  process.env.VIDEOS_DIR ? path.resolve(process.env.VIDEOS_DIR) : path.join(studioRoot(), "videos");
export const agentPidFile = () => path.join(studioRoot(), "data", "agent.pid");
export const workerPidFile = () => path.join(studioRoot(), "data", "worker.pid");
export const videoDir = (id: string) => path.join(videosDir(), id);
export const projectDir = (id: string) => path.join(videoDir(id), "project");
export const rendersDir = (id: string) => path.join(projectDir(id), "renders");
export const skillsSource = () => path.join(repoRoot(), ".agents", "skills");
export const kokoroPython = () =>
  process.env.HYPERFRAMES_PYTHON ?? path.join(repoRoot(), ".venv-kokoro", "bin", "python");
export const promptsDir = () => path.join(studioRoot(), "prompts");
export const fixturesDir = () => path.join(studioRoot(), "tests", "fixtures");
