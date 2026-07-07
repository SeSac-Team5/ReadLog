from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, field_validator


def to_camel(snake_str: str) -> str:
    first, *rest = snake_str.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    @field_validator("*", mode="before")
    @classmethod
    def _assume_naive_datetime_is_utc(cls, value):
        # DB의 TIMESTAMP/DATETIME 컬럼은 UTC로 채워지지만 tzinfo가 없어서,
        # tzinfo 없이 그대로 내려주면 프론트가 기기 로컬 타임존(KST)으로
        # 잘못 해석해 날짜가 최대 하루까지 밀린다 (연속독서 스트릭 계산 버그의 원인).
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
