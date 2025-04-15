// app/tools/page.tsx
import React from "react";
import Title from "../../components/Title"; // Adjust path as needed
import { FaCode, FaPaintBrush, FaMagic } from "react-icons/fa";
import { IconType } from "react-icons";
import "./style.css";

import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: IconType;
  link: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon: Icon,
  link,
}) => {
  return (
    <Link href={link}>
      <div className="flex flex-col items-center rounded-[10px] p-4 bg-white shadow-[2px_2px_var(--textColor)] transform transition-all cursor-pointer group rainbow-border">
        <Icon className="text-4xl mb-2 text-[var(--textColor)]" />
        <h3 className="text-xl font-semibold text-[var(--textColor)]">
          {title}
        </h3>
        <p className="text-gray-600 text-center">{description}</p>
      </div>
    </Link>
  );
};

interface Tool {
  title: string;
  description: string;
  icon: IconType; // Explicitly use IconType
  link: string;
}

const tools: Tool[] = [
  {
    title: "Code Preview Tool",
    description: "A tool to preview code snippets.",
    icon: FaCode,
    link: "/tools/code-preview-tool",
  },
  {
    title: "Neumorphic CSS Generator",
    description: "Generate neumorphic CSS styles easily.",
    icon: FaPaintBrush,
    link: "/tools/neumorohic-css-generator",
  },
  {
    title: "Buttons CSS Generator",
    description: "Create custom CSS for buttons.",
    icon: FaMagic,
    link: "/tools/buttons-css-generator",
  },
];

const ToolsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <Title variant="h1" label="Tools" />
      <p className="text-center mb-6 text-gray-700">
        Explore our collection of useful tools for developers and designers.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            link={tool.link}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
