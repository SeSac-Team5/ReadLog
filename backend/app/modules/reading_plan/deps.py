from fastapi import Header


def get_current_user_id(x_user_id: int = Header(default=1, alias="X-User-Id")) -> int:
    # Temporary stand-in until reading_plan's routers are wired to the real
    # session-cookie auth (app.common.deps.get_current_user). Scoped to this
    # module (not app/common/deps) so it doesn't collide with or shadow the
    # real dependency other modules already use.
    # Do not ship this as-is — any client can claim to be any user_id via the header.
    return x_user_id
