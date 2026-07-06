-- ReadLog Schema (latest sync with current backend models and planning docs)
-- Updated for auth soft-delete flow, reading-plan timeline/sticker features, and group schema changes
CREATE DATABASE IF NOT EXISTS readlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE readlog;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS comment_reactions,group_comments,reading_progress,chapter_goals,group_members,group_invites,reading_groups,sns_stickers,sns_posts,reviews,user_library,books,users;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users(
 id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
 login_id VARCHAR(30) NULL UNIQUE,
 password VARCHAR(255) NOT NULL,
 nickname VARCHAR(30) NULL UNIQUE,
 profile_image VARCHAR(500),
 introduction VARCHAR(255),
 role ENUM('USER','ADMIN') DEFAULT 'USER',
 is_deleted BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='회원';


CREATE TABLE books(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 isbn13 VARCHAR(20) UNIQUE,title VARCHAR(300) NOT NULL,
 author VARCHAR(200),publisher VARCHAR(200),description TEXT,
 cover_url VARCHAR(500),page_count INT,
 published_date DATE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='도서';


CREATE TABLE user_library(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL,book_id BIGINT NOT NULL,
 status ENUM('WISH','READING','COMPLETED') DEFAULT 'READING',
 rating DECIMAL(2,1),current_page INT DEFAULT 0,
 started_at DATE,completed_at DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE(user_id,book_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);
CREATE TABLE reviews(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT,book_id BIGINT,rating DECIMAL(2,1),
 review VARCHAR(300) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE(user_id,book_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);
CREATE TABLE sns_posts(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT,book_id BIGINT,image_url VARCHAR(500),
 content TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE SET NULL
);
CREATE TABLE sns_stickers(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 post_id BIGINT,emoji VARCHAR(20),x FLOAT NOT NULL,y FLOAT NOT NULL,scale FLOAT NOT NULL DEFAULT 1.0,rotation FLOAT NOT NULL DEFAULT 0.0,
 FOREIGN KEY(post_id) REFERENCES sns_posts(id) ON DELETE CASCADE
);


CREATE TABLE reading_groups(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT,book_id BIGINT,name VARCHAR(100),description VARCHAR(500),
 max_member INT,invite_code VARCHAR(30) UNIQUE,
 start_date DATE,end_date DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(owner_id) REFERENCES users(id),
 FOREIGN KEY(book_id) REFERENCES books(id)
);
CREATE TABLE group_invites(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 group_id BIGINT,invite_code VARCHAR(30),expires_at DATETIME,used BOOLEAN DEFAULT FALSE,
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE
);
CREATE TABLE group_members(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 group_id BIGINT,user_id BIGINT,
 role ENUM('OWNER','MANAGER','MEMBER'),
 joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(group_id,user_id),
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE chapter_goals(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 group_id BIGINT,chapter_name VARCHAR(100),target_date DATE,
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE
);
CREATE TABLE reading_progress(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 group_id BIGINT,user_id BIGINT,
 chapter VARCHAR(100),page INT,
 progress FLOAT CHECK(progress>=0 AND progress<=100),
 bookmark_title VARCHAR(100),memo VARCHAR(300),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 deleted_by_owner TINYINT(1) NOT NULL DEFAULT 0,
 dismissed_by_member TINYINT(1) NOT NULL DEFAULT 0,
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- owner가 soft delete한(deleted_by_owner=1) 뒤 멤버가 아직 확인하지 않은(dismissed_by_member=0) 알림 조회용
-- (backend/app/migrations/001_add_progress_soft_delete.sql 참고)
CREATE INDEX idx_reading_progress_soft_delete
  ON reading_progress (group_id, deleted_by_owner, dismissed_by_member);
CREATE TABLE group_comments(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 group_id BIGINT,user_id BIGINT,progress_id BIGINT,parent_comment_id BIGINT,
 content TEXT,quote TEXT,is_spoiler BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(progress_id) REFERENCES reading_progress(id) ON DELETE SET NULL,
 FOREIGN KEY(parent_comment_id) REFERENCES group_comments(id) ON DELETE CASCADE
);
CREATE TABLE comment_reactions(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 comment_id BIGINT,user_id BIGINT,emoji VARCHAR(20),
 UNIQUE(comment_id,user_id,emoji),
 FOREIGN KEY(comment_id) REFERENCES group_comments(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_ul_user ON user_library(user_id);
CREATE INDEX idx_ul_book ON user_library(book_id);
CREATE INDEX idx_gp_group ON reading_progress(group_id);
CREATE INDEX idx_gc_group ON group_comments(group_id);

-- ─────────────────────────────────────────────
-- V2.1 additions (팀 결정 반영 — CLAUDE.md §8)
-- ─────────────────────────────────────────────

-- 1) WISH 상태는 기존 user_library.status ENUM에 이미 존재 → 스키마 변경 불필요, 사용 확정만 하면 됨

-- 2) 개인 독서 진도 타임라인 (독서 진도 입력 화면의 "이전 진도 기록 리스트")
CREATE TABLE reading_progress_logs(
 id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
 library_id BIGINT NOT NULL COMMENT 'user_library.id 참조',
 page INT COMMENT '현재 페이지 (숫자 입력 방식일 때)',
 percent FLOAT CHECK(percent>=0 AND percent<=100) COMMENT '진행률 % (슬라이더 입력 방식일 때)',
 memo VARCHAR(300) COMMENT '선택 메모',
 recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '기록 시각 (자동 저장)',
 FOREIGN KEY(library_id) REFERENCES user_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개인 독서 진도 기록 타임라인';
CREATE INDEX idx_rpl_library ON reading_progress_logs(library_id);

-- 3) sns_stickers 확장: 이모지 스티커 / 진도 시각화 오버레이 / 코멘트 스티커를 한 테이블에서 구분
ALTER TABLE sns_stickers
  ADD COLUMN type ENUM('emoji','comment','progress_ring','progress_bar','progress_badge')
    NOT NULL DEFAULT 'emoji' COMMENT '스티커 종류',
  ADD COLUMN content VARCHAR(300) NULL COMMENT '코멘트 텍스트 또는 배지 문구 (emoji 타입일 때는 emoji 컬럼 사용)',
  ADD COLUMN visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT '오버레이 노출 토글 (끄기 가능)';

-- ─────────────────────────────────────────────
-- V2.2 additions
-- ─────────────────────────────────────────────

-- 1) sns_stickers.type에 'book_cover'(현재 읽고 있는 책의 표지 이미지 스티커) 추가.
--    별도 컬럼 없이 프론트에서 해당 book_library의 book.cover_url을 그려주는 방식이라 content/emoji는 비워둠.
ALTER TABLE sns_stickers
  MODIFY COLUMN type ENUM('emoji','comment','book_cover','progress_ring','progress_bar','progress_badge')
    NOT NULL DEFAULT 'emoji' COMMENT '스티커 종류';

-- 2) SNS 공유 화면의 하단 고정 코멘트 입력(sns_posts.content)은 제거 결정 — 코멘트는 코멘트 스티커로 대체.
--    컬럼 자체는 남겨두되(과거 게시물 호환) 신규 게시물에는 더 이상 값이 채워지지 않음.

-- 3) sns_posts.image_url을 VARCHAR(500) → LONGTEXT로 확장.
--    공용 이미지 업로드/스토리지가 아직 없어서(docs/reading-plan-tradeoffs.md 참고)
--    캡처한 이미지를 base64 data: URI로 직접 저장하는데, VARCHAR(500)로는 어림도 없음.
ALTER TABLE sns_posts
  MODIFY COLUMN image_url LONGTEXT NULL COMMENT '캡처 이미지 (현재는 data: URI 직접 저장, 추후 스토리지 URL로 교체 예정)';

-- ─────────────────────────────────────────────
-- V2.3 additions
-- ─────────────────────────────────────────────

-- 1) 코멘트 스티커 배경색 프리셋(화이트/그레이/투명/다크) 지원을 위한 컬럼 추가.
--    프리셋 키 문자열("white"|"gray"|"transparent"|"dark")을 저장 — 다른 스티커 타입은 NULL로 둠.
ALTER TABLE sns_stickers
  ADD COLUMN background_color VARCHAR(20) NULL COMMENT '코멘트 스티커 배경 프리셋 키 (white/gray/transparent/dark)';

-- ─────────────────────────────────────────────
-- V2.4 additions
-- ─────────────────────────────────────────────

-- 1) 이달의 목표(월별 완독 목표 권수) 저장용 신규 테이블.
--    completed 권수는 저장하지 않고 user_library.status/completed_at 기준으로 매번 계산해서 응답한다.
--    컬럼명은 year_month가 아니라 goal_month다 — YEAR_MONTH는 MySQL의 예약어(INTERVAL 단위)라
--    따옴표 없이 컬럼명으로 쓰면 문법 오류가 난다 (실제로 겪음, 아래 "MySQL 예약어" 섹션 참고).
CREATE TABLE reading_goals(
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  goal_month CHAR(7) NOT NULL COMMENT 'YYYY-MM',
  target_books INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reading_goals_user_month (user_id, goal_month),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자별 월간 완독 목표';

-- ─────────────────────────────────────────────
-- V2.5 additions (auth 모듈 통합 — origin/YSE)
-- ─────────────────────────────────────────────

-- 1) users.login_id / users.nickname을 NULL 허용으로 변경.
--    실제 auth 모듈의 User 모델(soft delete 설계)은 회원탈퇴 시 이 두 컬럼을 NULL로
--    비워서 같은 login_id/nickname을 다른 계정이 재사용할 수 있게 한다 — MySQL UNIQUE
--    인덱스는 NULL끼리는 중복으로 안 치기 때문. 기존 스키마는 NOT NULL이라 탈퇴 로직이
--    그대로 막힌다.
ALTER TABLE users
  MODIFY COLUMN login_id VARCHAR(30) NULL,
  MODIFY COLUMN nickname VARCHAR(30) NULL;

-- 2) 관심 장르(온보딩/마이페이지) 저장용 신규 테이블.
--    장르 값 자체의 검증은 백엔드 schemas/genre.py의 GENRE_CHOICES에서 수행.
CREATE TABLE user_genre_interests(
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  genre VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_genre (user_id, genre),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 관심 장르';

-- ─────────────────────────────────────────────
-- V2.6 removals (마이페이지 통합 점검 — A, origin/YSE)
-- ─────────────────────────────────────────────

-- 1) bookmarks 테이블 제거.
--    마이페이지 활동 탭에서 "북마크"와 "독서기록"이 사실상 같은 방향성(내가 읽은/읽고 있는 책 기록)으로
--    겹친다고 판단해 북마크를 별도 기능으로 유지하지 않기로 함. 백엔드에 이 테이블에 대응하는
--    모델/스키마/라우터가 처음부터 구현된 적이 없어(V1 설계 잔재) 실질적으로 죽은 테이블이었음.
DROP TABLE IF EXISTS bookmarks;

-- ─────────────────────────────────────────────
-- V2.7 additions
-- ─────────────────────────────────────────────

-- 1) 코멘트 스티커 기능 제거 — 코멘트는 SNS 공유 화면이 아니라 독서 진도 입력 화면에서
--    저장 시 남기는 방식으로 대체됐다 (reading_progress_logs.memo, V2.1부터 이미 존재).
--    sns_stickers.type ENUM에서 'comment'를 제거하고, comment 타입만 쓰던
--    content/background_color 컬럼도 함께 제거한다.
ALTER TABLE sns_stickers
  DROP COLUMN content,
  DROP COLUMN background_color,
  MODIFY COLUMN type ENUM('emoji','book_cover','progress_ring','progress_bar','progress_badge')
    NOT NULL DEFAULT 'emoji' COMMENT '스티커 종류';

-- ─────────────────────────────────────────────
-- V2.8 additions
-- ─────────────────────────────────────────────

-- 1) 코멘트 스티커 기능 부활 — 독서 진도 입력 화면에서 남긴 가장 최근 코멘트를
--    SNS 공유 화면에서 스티커로 붙일 수 있게 해달라는 요청으로 V2.7에서 뺐던
--    content/background_color 컬럼과 'comment' 타입을 다시 추가한다.
--    배경 프리셋도 4종 → 5종(white/beige/gray/dark/transparent)으로 확장.
ALTER TABLE sns_stickers
  ADD COLUMN content VARCHAR(300) NULL COMMENT '코멘트 텍스트 (emoji/book_cover/progress_* 타입은 비움)',
  ADD COLUMN background_color VARCHAR(20) NULL COMMENT '코멘트 스티커 배경 프리셋 키 (white/beige/gray/dark/transparent)',
  MODIFY COLUMN type ENUM('emoji','comment','book_cover','progress_ring','progress_bar','progress_badge')
    NOT NULL DEFAULT 'emoji' COMMENT '스티커 종류';

