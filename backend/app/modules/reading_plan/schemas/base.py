from pydantic import BaseModel, ConfigDict


def to_camel(snake_str: str) -> str:
    first, *rest = snake_str.split("_")
    return first + "".join(word.capitalize() for word in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
