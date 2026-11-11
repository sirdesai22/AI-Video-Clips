import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import * as p from "../../lib/paths";

describe("paths", () => {
  afterEach(() => { delete process.env.VIDEOS_DIR; });

  it("derives repo and skills paths from the studio root", () => {
    expect(p.repoRoot()).toBe(path.resolve(p.studioRoot(), ".."));
    expect(p.skillsSource()).toBe(path.join(p.repoRoot(), ".agents", "skills"));
    expect(p.kokoroPython()).toBe(path.join(p.repoRoot(), ".venv-kokoro", "bin", "python"));
  });

  it("nests project and renders inside the video folder and honours VIDEOS_DIR", () => {
    process.env.VIDEOS_DIR = "/tmp/rs-videos";
    expect(p.videoDir("abc")).toBe("/tmp/rs-videos/abc");
    expect(p.projectDir("abc")).toBe("/tmp/rs-videos/abc/project");
    expect(p.rendersDir("abc")).toBe("/tmp/rs-videos/abc/project/renders");
  });
});
