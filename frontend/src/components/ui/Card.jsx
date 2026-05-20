import { motion } from 'framer-motion';

// Reusable Card component
export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={hover ? { y: -4, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)" } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
