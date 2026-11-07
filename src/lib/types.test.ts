import { describe, expect, it } from "vitest";
import { tutorCitationPages, tutorSourceChange } from "@/lib/types";

describe("tutor source change metadata", () => {
  it("reads a recorded source change", () => {
    expect(
      tutorSourceChange({
        kind: "source_change",
        materialId: "material-1",
        materialName: "notes.pdf",
      })
    ).toEqual({ materialId: "material-1", materialName: "notes.pdf" });
    expect(
      tutorSourceChange({ kind: "source_change", materialId: null, materialName: null })
    ).toEqual({ materialId: null, materialName: null });
  });

  it("does not confuse source changes with page citations", () => {
    expect(tutorSourceChange({ pages: [1, 2] })).toBeNull();
    expect(tutorSourceChange(null)).toBeNull();
    expect(
      tutorCitationPages({
        kind: "source_change",
        materialId: "material-1",
        materialName: "notes.pdf",
      })
    ).toEqual([]);
  });
});
