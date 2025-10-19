"""
Unit tests for AI processor

Run with: python -m pytest tests/
"""

import pytest
from src.ai_processor import AIProcessor


class TestAIProcessor:
    """Test cases for AIProcessor class"""
    
    def test_initialization(self):
        """Test processor initialization"""
        processor = AIProcessor(model_name="test-model")
        assert processor is not None
        assert processor.model_name == "test-model"
    
    def test_process_text(self):
        """Test text processing"""
        processor = AIProcessor()
        
        result = processor.process_text("test input")
        
        assert result is not None
        assert "input" in result
        assert "processed" in result
        assert result["input"] == "test input"
    
    def test_classify(self):
        """Test classification"""
        processor = AIProcessor()
        
        categories = ["category1", "category2", "category3"]
        result = processor.classify("test text", categories)
        
        assert result is not None
        assert "category" in result
        assert result["category"] in categories
        assert "confidence" in result
    
    def test_generate(self):
        """Test text generation"""
        processor = AIProcessor()
        
        generated = processor.generate("test prompt", max_length=50)
        
        assert generated is not None
        assert isinstance(generated, str)
        assert len(generated) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
