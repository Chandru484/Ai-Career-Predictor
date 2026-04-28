import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -15, filter: 'blur(4px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
};

export default function PageTransition({ children, className = "h-full" }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
