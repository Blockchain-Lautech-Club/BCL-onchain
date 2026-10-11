from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class QuizOption(BaseModel):
    id: int
    text: str


class DailyQuizCreate(BaseModel):
    quiz_date: str = Field(..., description="Date for quiz in YYYY-MM-DD")
    title: str = Field(..., min_length=3, max_length=250)
    topic: str = Field("Web3 Security", max_length=100)
    description: str = Field("")
    question: str = Field(..., min_length=5)
    options: list[QuizOption]
    correct_index: int = Field(0, ge=0, le=10)
    explanation: str = Field("")
    points: int = Field(50, ge=1)
    is_active: bool = True


class DailyQuizUpdate(BaseModel):
    quiz_date: str | None = None
    title: str | None = None
    topic: str | None = None
    description: str | None = None
    question: str | None = None
    options: list[QuizOption] | None = None
    correct_index: int | None = None
    explanation: str | None = None
    points: int | None = None
    is_active: bool | None = None


class DailyQuizOut(BaseModel):
    id: int
    quiz_date: str
    title: str
    topic: str
    description: str
    question: str
    options: list[QuizOption]
    points: int
    is_active: bool
    created_at: datetime
    correct_index: int | None = None
    explanation: str | None = None

    class Config:
        from_attributes = True


class QuizSubmitRequest(BaseModel):
    quiz_id: int | None = None
    answer_index: int
