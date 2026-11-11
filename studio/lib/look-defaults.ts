import type { Script } from "./script-schema";

export const DEFAULT_LOOK: Script["look"] = {
  ground: "#F5F3EE", ink: "#16181D", accent: "#2F5BEA",
  type: "bold sans", captionStyle: "none", voiceTone: "calm", musicMood: "none",
};
// Device and form are exact names from prompts/script.md.
export const DEFAULT_CONCEPT: Script["concept"] = {
  device: "Type carries the argument", form: "One frame that rebuilds", spectacle: "the key line lands",
};

/** Scripts saved before look/concept existed lack them; fill neutral defaults so they can be edited and saved. */
export function withLookDefaults(script: Omit<Script, "look" | "concept"> & Partial<Pick<Script, "look" | "concept">>): Script {
  return { ...script, look: script.look ?? { ...DEFAULT_LOOK }, concept: script.concept ?? { ...DEFAULT_CONCEPT } };
}
