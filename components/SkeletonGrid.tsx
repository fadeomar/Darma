import { motion } from "framer-motion";

const SkeletonCard = () => {
  return (
    <motion.div
      className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl p-4 shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded-xl mb-4"></div>
      <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </motion.div>
  );
};

const SkeletonGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonGrid;
