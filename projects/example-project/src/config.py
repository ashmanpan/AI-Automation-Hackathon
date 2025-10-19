"""
Configuration management for the automation project
"""

import os
from typing import Dict, Any


class Config:
    """Configuration class for the application"""
    
    # AI Model Configuration
    AI_MODEL_NAME = os.getenv("AI_MODEL_NAME", "default-model")
    AI_API_KEY = os.getenv("AI_API_KEY", "")
    AI_API_ENDPOINT = os.getenv("AI_API_ENDPOINT", "https://api.example.com")
    
    # Automation Settings
    AUTOMATION_INTERVAL = int(os.getenv("AUTOMATION_INTERVAL", "60"))  # seconds
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
    TIMEOUT = int(os.getenv("TIMEOUT", "30"))  # seconds
    
    # Application Settings
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Data Storage
    DATA_DIR = os.getenv("DATA_DIR", "data")
    OUTPUT_DIR = os.getenv("OUTPUT_DIR", "output")
    
    @classmethod
    def to_dict(cls) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            key: value
            for key, value in cls.__dict__.items()
            if not key.startswith("_") and key.isupper()
        }
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        # Add validation logic here
        if cls.DEBUG:
            print("Running in DEBUG mode")
        
        # Check required settings
        if not cls.AI_API_KEY:
            print("Warning: AI_API_KEY not set")
        
        return True


# Create directories if they don't exist
def ensure_directories():
    """Ensure required directories exist"""
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    os.makedirs(Config.OUTPUT_DIR, exist_ok=True)


if __name__ == "__main__":
    # Test configuration
    Config.validate()
    print("Configuration:")
    for key, value in Config.to_dict().items():
        # Don't print sensitive values
        if "KEY" in key or "PASSWORD" in key:
            print(f"  {key}: {'*' * 8}")
        else:
            print(f"  {key}: {value}")
