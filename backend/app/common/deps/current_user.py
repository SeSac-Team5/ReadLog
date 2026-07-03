from fastapi import Header


def get_current_user_id(x_user_id: int = Header(default=1, alias="X-User-Id")) -> int:
    # Temporary stand-in until the auth module wires up real JWT/session verification.
    # Do not ship this as-is — any client can claim to be any user_id via the header.
    return x_user_id
