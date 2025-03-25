export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  if (typeof dateString === "undefined") {
    return "";
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export const getGradientColor = (index: number) => {
  const gradients = [
    { from: "#A5A7F9", to: "#D4A5FC" }, // Lighter Indigo to Lighter Purple
    { from: "#8AB6FA", to: "#A3CFFF" }, // Lighter Blue to Lighter Light Blue
    { from: "#4ADCA6", to: "#73E8C0" }, // Lighter Green to Lighter Light Green
    { from: "#FABE5A", to: "#FDD171" }, // Lighter Amber to Lighter Yellow
    { from: "#F78787", to: "#FCA6A6" }, // Lighter Red to Lighter Light Red
    { from: "#B592FA", to: "#DED5FE" }, // Lighter Violet to Lighter Light Violet
  ];
  return gradients[index % gradients.length];
};
