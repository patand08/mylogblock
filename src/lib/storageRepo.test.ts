import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
}));

import { uploadCoverImage } from "./storageRepo";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadCoverImage", () => {
  it("returns public url on success", async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/covers/abc.jpg" } });

    const file = new File(["img"], "cover.jpg", { type: "image/jpeg" });
    const url = await uploadCoverImage("page-1", file);
    expect(url).toBe("https://cdn.example.com/covers/abc.jpg");
  });

  it("throws on upload error", async () => {
    mockUpload.mockResolvedValue({ error: new Error("Upload failed") });

    const file = new File(["img"], "cover.jpg", { type: "image/jpeg" });
    await expect(uploadCoverImage("page-1", file)).rejects.toThrow("Upload failed");
  });

  it("uploads to covers/ path with pageId prefix", async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/covers/page-1_cover.jpg" } });

    const file = new File(["img"], "cover.jpg", { type: "image/jpeg" });
    await uploadCoverImage("page-1", file);
    expect(mockUpload.mock.calls[0][0]).toMatch(/^covers\/page-1_/);
  });
});
