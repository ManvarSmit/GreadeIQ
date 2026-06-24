const logger = {
  info: (message, ...optionalParams) => {
    console.log(`[INFO] ${message}`, ...optionalParams);
  },
  error: (message, ...optionalParams) => {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  },
  warn: (message, ...optionalParams) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  },
  debug: (message, ...optionalParams) => {
    console.debug(`[DEBUG] ${message}`, ...optionalParams);
  }
};

export default logger;

