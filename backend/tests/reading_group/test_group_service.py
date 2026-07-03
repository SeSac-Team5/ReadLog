"""reading_group 서비스 단위 테스트."""
import pytest
from unittest.mock import MagicMock, patch
from app.modules.reading_group.models.group import MemberRole
from app.modules.reading_group.services import group_service, member_service, invite_service
from app.common.exceptions import BadRequestException, ForbiddenException


@pytest.fixture
def db():
    return MagicMock()


class TestCreateGroup:
    def test_creates_group_and_owner_member(self, db):
        data = MagicMock(
            book_id=1, name="테스트 모임", description=None,
            is_public=True, max_member=8, start_date=None, end_date=None,
        )
        db.flush = MagicMock()
        db.commit = MagicMock()
        db.refresh = MagicMock()
        db.add = MagicMock()

        with patch("app.modules.reading_group.services.group_service._gen_invite_code", return_value="RDLG-TEST"):
            group_service.create_group(db, user_id=1, data=data)

        assert db.add.call_count == 2  # ReadingGroup + GroupMember


class TestDelegateOwnership:
    def test_raises_if_self_delegation(self, db):
        actor = MagicMock(user_id=1, role=MemberRole.OWNER)
        target = MagicMock(user_id=1, role=MemberRole.MEMBER)

        db.query.return_value.filter.return_value.first.side_effect = [actor, target]

        with patch("app.modules.reading_group.services.member_service._require_role"):
            with pytest.raises(BadRequestException):
                member_service.delegate_ownership(db, group_id=1, actor_id=1, target_user_id=1)

    def test_swaps_roles_atomically(self, db):
        owner_member = MagicMock(user_id=10, role=MemberRole.OWNER)
        target_member = MagicMock(user_id=20, role=MemberRole.MEMBER)

        db.query.return_value.filter.return_value.first.side_effect = [
            target_member, owner_member,
        ]

        with patch("app.modules.reading_group.services.member_service._require_role"):
            member_service.delegate_ownership(db, group_id=1, actor_id=10, target_user_id=20)

        assert target_member.role == MemberRole.OWNER
        assert owner_member.role == MemberRole.MANAGER
        db.commit.assert_called_once()


class TestJoinByCode:
    def test_raises_when_code_invalid(self, db):
        db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(BadRequestException):
            invite_service.join_by_code(db, user_id=1, code="INVALID")

    def test_raises_when_already_member(self, db):
        group = MagicMock(id=1, max_member=8, invite_code="RDLG-OK")
        existing_member = MagicMock()
        db.query.return_value.filter.return_value.first.side_effect = [group, existing_member]

        from app.common.exceptions import ConflictException
        with pytest.raises(ConflictException):
            invite_service.join_by_code(db, user_id=1, code="RDLG-OK")
