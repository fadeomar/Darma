import { Metadata } from "next";
import AnimatedBackgroundClient from "./AnimatedBackgroundClient";

export const metadata: Metadata = {
  title: "Free Animated Background Generator - Create Dynamic CSS Backgrounds",
  description:
    "Generate stunning animated CSS backgrounds with our free tool. Customize particles, bubbles, or explosions for websites, presentations, or designs.",
  keywords: [
    "animated background generator",
    "CSS animations",
    "free background tool",
    "dynamic backgrounds",
    "web design tool",
  ],
  openGraph: {
    title: "Free Animated Background Generator",
    description:
      "Create dynamic CSS animated backgrounds with particles, bubbles, or explosions. Free and easy to use!",
    url: "https://yourwebsite.com/tools/animated-background",
    type: "website",
  },
};

export default function AnimatedBackgroundPage() {
  return <AnimatedBackgroundClient />;
}
