import { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  animation?: "fade" | "slideUp" | "scale" | "none";
  delay?: number;
}

export function AnimatedContainer({
  children,
  className,
  animation = "fade",
  delay = 0,
}: AnimatedContainerProps) {
  const getAnimationConfig = () => {
    switch (animation) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case "slideUp":
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
        };
      case "scale":
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
        };
      default:
        return {
          initial: {},
          animate: {},
          exit: {},
        };
    }
  };

  const config = getAnimationConfig();
  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function StaggeredGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
}: StaggeredGridProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.1,
          },
        },
        exit: {},
      }}
      className={cn(
        "grid gap-4",
        `grid-cols-${cols.xs}`,
        `sm:grid-cols-${cols.sm}`,
        `md:grid-cols-${cols.md}`,
        `lg:grid-cols-${cols.lg}`,
        `xl:grid-cols-${cols.xl}`,
        className
      )}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function AnimatedCard({ children, className, onClick, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      onClick={onClick}
      className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  onClick,
  variant = "primary",
  disabled = false,
}: AnimatedButtonProps) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}
