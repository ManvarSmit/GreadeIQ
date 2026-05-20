import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to detect cheating behaviors like tab switching and window unfocusing.
 * @param {Function} onViolation - Callback function triggered when a violation occurs.
 * @param {number} maxViolations - Maximum allowed violations before auto-submit.
 */
export const useAntiCheat = (onViolation, maxViolations = 3) => {
    const [violations, setViolations] = useState(0);
    const hasTriggeredRef = useRef(false);
    const lastViolationTime = useRef(0);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                registerViolation('TAB_SWITCH');
            }
        };

        const handleWindowBlur = () => {
            registerViolation('BLUR_FOCUS');
        };

        const registerViolation = (type) => {
            if (hasTriggeredRef.current) return;
            
            // Prevent double-counting if events fire simultaneously (like minimizing window triggers both blur and visibilitychange)
            const now = Date.now();
            if (now - lastViolationTime.current < 2000) return;
            lastViolationTime.current = now;
            
            setViolations(prev => {
                const newCount = prev + 1;
                onViolation(type, newCount, newCount >= maxViolations);
                if (newCount >= maxViolations) {
                    hasTriggeredRef.current = true;
                }
                return newCount;
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [onViolation, maxViolations]);

    return { violations };
};
