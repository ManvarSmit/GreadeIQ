import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false
}) => {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: <AlertTriangle className="text-rose-600" size={32} />,
            bg: "bg-rose-50",
            button: "bg-rose-600 hover:bg-rose-700 text-white"
        },
        warning: {
            icon: <AlertTriangle className="text-amber-600" size={32} />,
            bg: "bg-amber-50",
            button: "bg-amber-600 hover:bg-amber-700 text-white"
        },
        info: {
            icon: <AlertTriangle className="text-indigo-600" size={32} />,
            bg: "bg-indigo-50",
            button: "bg-indigo-600 hover:bg-indigo-700 text-white"
        }
    };

    const style = variants[variant] || variants.danger;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-dark-surface border border-dark-border rounded-2xl shadow-2xl p-6 overflow-hidden"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-slate-400 hover:text-dark-muted transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${style.bg}`}>
                            {style.icon}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-dark-muted mb-8">{message}</p>

                        <div className="flex justify-center gap-3 w-full">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full justify-center"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                className={`${style.button} w-full justify-center`}
                                onClick={onConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : confirmText}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
