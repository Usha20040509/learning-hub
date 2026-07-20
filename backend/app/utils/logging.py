import logging

from app.config.settings import settings


logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger("internal_training_portal")
