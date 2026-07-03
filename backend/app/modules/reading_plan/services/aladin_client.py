from typing import Any, Optional

import httpx

from app.core.config import settings

ALADIN_SEARCH_URL = "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx"
ALADIN_LOOKUP_URL = "https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx"


async def search_books_from_aladin(query: str, page: int, page_size: int) -> dict[str, Any]:
    params = {
        "ttbkey": settings.ALADIN_API_KEY,
        "Query": query,
        "QueryType": "Keyword",
        "SearchTarget": "Book",
        "Start": page,
        "MaxResults": page_size,
        "Cover": "Big",
        "Output": "JS",
        "Version": "20131101",
    }
    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        response = await client.get(ALADIN_SEARCH_URL, params=params)
        response.raise_for_status()
        return response.json()


def lookup_book_by_isbn(isbn13: str) -> Optional[dict[str, Any]]:
    params = {
        "ttbkey": settings.ALADIN_API_KEY,
        "ItemIdType": "ISBN13",
        "ItemId": isbn13,
        "Cover": "Big",
        "Output": "JS",
        "Version": "20131101",
    }
    with httpx.Client(timeout=5.0, follow_redirects=True) as client:
        response = client.get(ALADIN_LOOKUP_URL, params=params)
        response.raise_for_status()
        data = response.json()

    items = data.get("item") or []
    return items[0] if items else None
