import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function LoadingSpinner({ text = "Wczytywanie danych..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full border-t-2 border-primary blur-sm"></div>
        <Loader2 className="w-12 h-12 text-primary" />
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 font-display text-lg text-primary/80 tracking-widest uppercase"
      >
        {text}
      </motion.p>
    </div>
  );
}
