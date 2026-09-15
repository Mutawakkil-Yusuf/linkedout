import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LinkedOut",
    short_name: "LinkedOut",
    description: "The network where you cannot be found by employers.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f3",
    theme_color: "#fdf8f3",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
