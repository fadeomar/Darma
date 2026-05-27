
import { motion } from "framer-motion";

const SkeletonCard = () => {
  return (
    <motion.div
      className="animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-4 shadow-[var(--shadow-card)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4 h-40 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)]" />
      <div className="mb-2 h-4 w-3/4 rounded-[var(--radius-full)] bg-[var(--color-control-track)]" />
      <div className="h-4 w-1/2 rounded-[var(--radius-full)] bg-[var(--color-control-track)]" />
    </motion.div>
  );
};

const SkeletonGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonGrid;
