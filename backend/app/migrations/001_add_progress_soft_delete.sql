-- Migration: 001_add_progress_soft_delete
-- 진도 soft delete 필드 추가 (owner 삭제 알림 기능)

ALTER TABLE reading_progress
  ADD COLUMN deleted_by_owner    TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN dismissed_by_member TINYINT(1) NOT NULL DEFAULT 0;

-- deleted_by_owner=1이고 dismissed_by_member=0인 레코드를 빠르게 조회하기 위한 인덱스
CREATE INDEX idx_reading_progress_soft_delete
  ON reading_progress (group_id, deleted_by_owner, dismissed_by_member);
