import enum


class LibraryStatus(str, enum.Enum):
    WISH = "WISH"
    READING = "READING"
    COMPLETED = "COMPLETED"
