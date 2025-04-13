"use client";
import {
  LucideLightbulb,
  LucideCode,
  LucideLayoutDashboard,
} from "lucide-react";
import cn from "@/utils/cn"; // Assuming you have a utility for classNames
import { ReactNode } from "react";

// Card and CardContent components for consistency with NeumorphismArticle
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

const ButtonCSSGeneratorArticle = () => {
  return (
    <div className="bg-background min-h-screen p-4 md:p-8 md:px-8 soft-shadow rounded-xl">
      <div className="max-w-4xl mx-auto">
        {/* Title Section */}
        <h1 className="text-4xl font-bold text-textColor text-center mb-6">
          🎨 Button CSS Generator
        </h1>
        <p className="text-lg text-center text-textColor mb-10">
          Create stunning, custom buttons with effortless precision. Tailor
          every detail to match your website’s vibe.
        </p>

        {/* Introduction */}
        <Card className="shadow-lg p-6 bg-baseColor rounded-2xl text-textColor">
          <CardContent>
            <h2 className="text-2xl font-semibold mb-4 text-textColor">
              🔧 What is the Button CSS Generator?
            </h2>
            <p className="text-textColor">
              A powerful tool that allows you to design bespoke buttons with
              unparalleled flexibility. Craft buttons that elevate your site’s
              interactivity and style without writing a single line of code.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideLightbulb className="text-darkColor w-8 h-8 mb-3 dark:text-lightColor" />
              <h3 className="text-xl font-semibold text-textColor">
                Unmatched Customization
              </h3>
              <p className="text-textColor">
                Fine-tune size, colors, shadows, hover effects, and more.
              </p>
            </CardContent>
          </Card>
          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideCode className="text-darkColor w-8 h-8 mb-3 dark:text-lightColor" />
              <h3 className="text-xl font-semibold text-textColor">
                Diverse Variants
              </h3>
              <p className="text-textColor">
                Choose from 3D, gradients, glow, and other eye-catching styles.
              </p>
            </CardContent>
          </Card>
          <Card className="p-6 bg-baseColor rounded-2xl shadow-inner">
            <CardContent>
              <LucideLayoutDashboard className="text-darkColor dark:text-lightColor w-8 h-8 mb-3" />
              <h3 className="text-xl font-semibold text-textColor">
                Dynamic Hover Effects
              </h3>
              <p className="text-textColor">
                Bring buttons to life with interactive hover states.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to Use */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-textColor">
            📋 How to Use the Generator
          </h2>
          <Card className="p-6 bg-baseColor rounded-2xl shadow-lg">
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-textColor">
                <li>
                  <strong>Select a Variant</strong>: Choose from styles like 3D,
                  glow, or gradients.
                </li>
                <li>
                  <strong>Customize Colors</strong>: Use color pickers to set
                  text, background, and shadow colors.
                </li>
                <li>
                  <strong>Adjust Details</strong>: Modify size, shadows, and
                  other properties with sliders.
                </li>
                <li>
                  <strong>Preview in Real-Time</strong>: See your button evolve
                  as you make changes.
                </li>
                <li>
                  <strong>Generate CSS</strong>: Copy the clean, semantic CSS
                  code and use it in your project.
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-textColor">
            🚀 Ready to Create Something Epic?
          </h2>
          <p className="text-textColor mb-6">
            Start designing custom, professional-grade buttons today. Your
            website deserves it.
          </p>
          <button className="bg-primary text-white py-2 px-6 rounded-lg shadow-md hover:bg-primary-dark transition-colors">
            Try the Generator Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ButtonCSSGeneratorArticle;
