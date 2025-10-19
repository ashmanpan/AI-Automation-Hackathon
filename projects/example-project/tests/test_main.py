"""
Unit tests for the automation engine

Run with: python -m pytest tests/
"""

import pytest
from src.main import AutomationEngine


class TestAutomationEngine:
    """Test cases for AutomationEngine class"""
    
    def test_initialization(self):
        """Test engine initialization"""
        engine = AutomationEngine()
        assert engine is not None
        assert not engine.is_running
    
    def test_start_stop(self):
        """Test starting and stopping the engine"""
        engine = AutomationEngine()
        
        engine.start()
        assert engine.is_running
        
        engine.stop()
        assert not engine.is_running
    
    def test_process_task(self):
        """Test task processing"""
        engine = AutomationEngine()
        
        task = {
            "id": "test-task-001",
            "type": "test",
            "data": "test data"
        }
        
        result = engine.process_task(task)
        
        assert result is not None
        assert result["status"] == "success"
        assert result["task_id"] == "test-task-001"
    
    def test_with_config(self):
        """Test engine with custom configuration"""
        config = {
            "ai_model": "test-model",
            "automation_type": "test"
        }
        
        engine = AutomationEngine(config=config)
        assert engine.config == config


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
