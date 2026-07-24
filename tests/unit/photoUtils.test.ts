import {
  coverPhotoClassName,
  coverPhotoStyle,
  optimizePhotoUrl,
} from "../../src/react-app/photoUtils";

describe("photoUtils", () => {
  it("builds cover photo class and focus style", () => {
    expect(coverPhotoClassName()).toBe("h-full w-full object-cover object-center");
    expect(coverPhotoClassName("rounded")).toContain("rounded");
    expect(coverPhotoStyle({ focus: "30% 40%" })).toEqual({ objectPosition: "30% 40%" });
    expect(coverPhotoStyle(undefined)).toBeUndefined();
  });

  it("optimizes known CDN photo URLs", () => {
    const unsplash = optimizePhotoUrl("https://images.unsplash.com/photo-123", 800);
    expect(unsplash).toContain("w=800");
    expect(unsplash).toContain("auto=format");

    const pexels = optimizePhotoUrl("https://images.pexels.com/photos/1.jpeg", 600);
    expect(pexels).toContain("w=600");
    expect(pexels).toContain("auto=compress");
  });

  it("leaves data URLs and unknown hosts alone", () => {
    expect(optimizePhotoUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(optimizePhotoUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(optimizePhotoUrl("not a url")).toBe("not a url");
  });
});
