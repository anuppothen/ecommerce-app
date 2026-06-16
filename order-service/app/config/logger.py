import logging
import os
from pathlib import Path

# Create logs directory if it does not exist
Path("logs").mkdir(exist_ok=True)


# Get log level from the environment variable - default to INFO
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Create the logger
logger = logging.getLogger("order-service")
logger.setLevel(LOG_LEVEL)

# -- Formatter ------------------------
# Same format as our Node.js services for consistency
formatter = logging.Formatter(
    "[%(asctime)s %(levelname)s: %(message)s]",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# -- Console Handler ------------------
# Prints logs to terminal
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# -- File Handlers --------------------
# All logs -> combined.log
file_handler = logging.FileHandler("logs/combined.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Only errors -> error.log
error_handler = logging.FileHandler("logs/error.log")
error_handler.setLevel(logging.ERROR)
error_handler.setFormatter(formatter)
logger.addHandler(error_handler)