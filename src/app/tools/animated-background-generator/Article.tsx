"use client";
import Image from "next/image";
import {
  LucideLightbulb,
  LucideCode,
  LucideLayoutDashboard,
} from "lucide-react";
import cn from "@/utils/cn";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}
interface CardContentProps {
  children: ReactNode;
}

export const CardContent = ({ children }: CardContentProps) => {
  return <div className="text-foreground">{children}</div>;
};

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={cn("bg-baseColor rounded-2xl shadow-lg p-6", className)}>
      {children}
    </div>
  );
};
const NeumorphismArticle = () => {
  return (
    <div className="bg-background min-h-screen p-4 md:p-8 md:px-8 soft-shadow rounded-xl">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <h1 className="text-4xl font-bold text-textColor text-center mb-6">
          💡 Neumorphism in User Interfaces
        </h1>
        <p className="text-lg text-center  text-textColor  mb-10">
          A modern UI trend blending skeuomorphism and flat design to create
          soft, realistic visuals.
        </p>

        {/* Introduction */}
        <Card className="shadow-lg p-6 bg-baseColor rounded-2xl text-textColor">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4 text-textColor">
              🔍 What is Neumorphism?
            </h2>
            <p className="text-textColor">
              Neumorphism is a design trend that uses subtle shadows and
              highlights to create a soft, 3D-like effect. It provides a
              minimalist yet tactile experience, making UI components feel more
              interactive.
            </p>
          </CardContent>
        </Card>

        {/* Characteristics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideLightbulb className="text-darkColor w-8 h-8 mb-3 dark:text-lightColor" />
              <h3 className="text-xl font-semibold text-textColor">
                Soft Shadows
              </h3>
              <p className="text-textColor">
                Elements appear embossed or debossed using light and shadow
                effects.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideCode className="text-darkColor w-8 h-8 mb-3 dark:text-lightColor" />
              <h3 className="text-xl font-semibold text-textColor">
                Minimalism
              </h3>
              <p className="text-textColor">
                A clean design approach that avoids strong borders and harsh
                shadows.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideLayoutDashboard className="text-darkColor dark:text-lightColor w-8 h-8 mb-3" />
              <h3 className="text-xl font-semibold text-textColor">
                Subtle Gradients
              </h3>
              <p className="text-textColor">
                Soft color transitions help create depth and realism.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Implementation in Code */}
        {/* <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4 text-textColor">
            ⚡ Implementing Neumorphism with TailwindCSS
          </h2>
          <p className="mb-6 text-textColor">
            You can achieve neumorphic effects using box shadows and background
            colors. Here’s an example:
          </p>
          <pre className="bg-lightColor dark:bg-darkColor text-darkColor dark:text-lightColor p-4 rounded-xl overflow-x-auto">
            {`  .neumorphic {
    background: #e0e0e0;
    box-shadow: 8px 8px 16px #9b9b9b,
                -8px -8px 16px #ffffff;
    border-radius: 12px;
  }`}
          </pre>
        </div> */}

        {/* Example Image */}
        <div className="mt-10 text-center">
          <Image
            src="https://assets.justinmind.com/wp-content/uploads/2020/04/neomorphism-ui-nitch.png"
            width={600}
            height={400}
            alt="Neumorphic UI Example"
            className="mx-auto rounded-xl shadow-lg max-w-full h-auto"
          />
          <p className="text-textColor mt-4">
            An example of a neumorphic button with soft shadows.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeumorphismArticle;
