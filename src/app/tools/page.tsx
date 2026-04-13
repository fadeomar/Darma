import React from "react";
import Title from "../../components/Title";

import {
  FaCode,
  FaPaintBrush,
  FaMagic,
  FaQrcode,
  FaFilm,
  FaPalette,
  FaCube,
} from "react-icons/fa";
import { IconType } from "react-icons";
import "./style.css";
import ToolCardLink from "@/components/analytics/ToolCardLink";
import { getToolRegistry } from "@/features/tools";

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
    <ToolCardLink href={link} toolName={title}>
      <div className="flex flex-col items-center rounded-[10px] p-4 bg-white shadow-[2px_2px_var(--textColor)] transform transition-all cursor-pointer group rainbow-border">
        <Icon className="text-4xl mb-2 text-[var(--textColor)]" />
        <h3 className="text-xl font-semibold text-[var(--textColor)]">
          {title}
        </h3>
        <p className="text-gray-600 text-center">{description}</p>
      </div>
    </ToolCardLink>
  );
};

const ICONS: Record<string, IconType> = {
  code: FaCode,
  paint: FaPaintBrush,
  magic: FaMagic,
  qrcode: FaQrcode,
  film: FaFilm,
  palette: FaPalette,
  cube: FaCube,
};

const ToolsPage: React.FC = () => {
  const tools = getToolRegistry()
    .list()
    .filter((t) => t.visibility === "public");

  return (
    <div className="container mx-auto p-4">
      <Title variant="h1" label="Tools" />
      <p className="text-center mb-6 text-gray-700">
        Explore our collection of useful tools for developers, designers, and
        creators.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            icon={ICONS[tool.icon ?? "code"] ?? FaCode}
            link={tool.href}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
