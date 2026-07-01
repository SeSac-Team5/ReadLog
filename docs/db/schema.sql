-- ReadLog Schema V2
-- Enhanced schema with comments, indexes and audit fields
CREATE DATABASE IF NOT EXISTS readlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE readlog;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS comment_reactions,group_comments,reading_progress,chapter_goals,group_members,group_invites,reading_groups,sns_stickers,sns_posts,reviews,bookmarks,user_library,books,users;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users(
 id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
 login_id VARCHAR(30) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL,
 nickname VARCHAR(30) NOT NULL UNIQUE,
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
CREATE TABLE bookmarks(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 library_id BIGINT NOT NULL,
 title VARCHAR(100),page INT,note VARCHAR(300),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(library_id) REFERENCES user_library(id) ON DELETE CASCADE
);


CREATE TABLE reviews(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT,book_id BIGINT,rating DECIMAL(2,1),
 review VARCHAR(300),
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
 post_id BIGINT,emoji VARCHAR(20),x FLOAT,y FLOAT,scale FLOAT,rotation FLOAT,
 FOREIGN KEY(post_id) REFERENCES sns_posts(id) ON DELETE CASCADE
);


CREATE TABLE reading_groups(
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 owner_id BIGINT,book_id BIGINT,name VARCHAR(100),description VARCHAR(500),
 is_public BOOLEAN,max_member INT,invite_code VARCHAR(30) UNIQUE,
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
 FOREIGN KEY(group_id) REFERENCES reading_groups(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
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

