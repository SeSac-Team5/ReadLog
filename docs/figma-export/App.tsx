import { useState } from "react";
import {
  Search, Home, BookOpen, Users, User, ChevronRight, Plus, ArrowLeft,
  Heart, Share2, Check, X, Camera, Smile, Copy, Settings,
  Bell, Edit2, Lock, Trash2, Eye, EyeOff, MoreVertical, Star,
  BookMarked, Calendar, Send, AlertTriangle, Link as LinkIcon,
} from "lucide-react";

// ────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ────────────────────────────────────────────────────────────

const SB = () => (
  <div className="flex justify-between items-center px-5 py-2 text-[11px] font-medium shrink-0 text-[#1C1A16]">
    <span>9:41</span>
    <div className="flex gap-1.5 items-center">
      <span className="font-bold">●●●</span>
      <span>Wi-Fi</span>
      <span>⬛</span>
    </div>
  </div>
);

function NavBar({
  title,
  back = false,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-black/8 bg-[#FDFBF4]">
      <div className="w-8">
        {back && <ArrowLeft size={20} className="text-[#2D4A3E]" />}
      </div>
      <span className="font-serif text-sm font-medium text-[#1C1A16] tracking-wide">{title}</span>
      <div className="w-8 flex justify-end">{right}</div>
    </div>
  );
}

function TabBar({ active }: { active: "home" | "library" | "groups" | "profile" }) {
  const tabs = [
    { id: "home" as const, label: "홈", Icon: Home },
    { id: "library" as const, label: "내 서재", Icon: BookOpen },
    { id: "groups" as const, label: "독서모임", Icon: Users },
    { id: "profile" as const, label: "마이", Icon: User },
  ];
  return (
    <div className="flex border-t border-black/8 bg-[#FDFBF4] shrink-0 pb-4">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`flex-1 flex flex-col items-center pt-2 gap-0.5 ${
            active === id ? "text-[#2D4A3E]" : "text-[#9E9E8A]"
          }`}
        >
          <Icon size={22} strokeWidth={active === id ? 2 : 1.5} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Frame({ children, bg = "#F5EFE0" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: 390, height: 844, background: bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}

function Field({
  placeholder,
  type = "text",
  right,
  value,
}: {
  placeholder: string;
  type?: string;
  right?: React.ReactNode;
  value?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={value}
        className="w-full bg-[#EDE7D8] rounded-xl px-4 py-3 text-sm text-[#1C1A16] placeholder-[#9E9E8A] outline-none border border-black/8"
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}

function PrimaryBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-full bg-[#2D4A3E] text-[#FDFBF4] rounded-xl py-3.5 text-sm font-medium">
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-[#7A7060] mb-1.5 block">{children}</label>;
}

// ────────────────────────────────────────────────────────────
// 1. 로그인
// ────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <Frame>
      <SB />
      <div className="flex-1 flex flex-col px-6">
        <div className="flex flex-col items-center pt-14 pb-10">
          <div className="w-16 h-16 bg-[#2D4A3E] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <BookMarked size={28} className="text-[#FDFBF4]" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-2xl text-[#1C1A16] tracking-widest">READLOG</span>
          <p className="text-xs text-[#9E9E8A] mt-1.5">나만의 독서 기록, 함께하는 독서</p>
        </div>

        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle size={12} />
          아이디 또는 비밀번호가 올바르지 않습니다.
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <Field placeholder="아이디" />
          <Field placeholder="비밀번호" type="password" right={<Eye size={16} className="text-[#9E9E8A]" />} />
        </div>

        <PrimaryBtn>로그인</PrimaryBtn>

        <p className="mt-4 text-center text-sm text-[#9E9E8A]">
          계정이 없으신가요?{" "}
          <span className="text-[#2D4A3E] font-medium underline underline-offset-2">회원가입</span>
        </p>

        <p className="mt-auto pb-8 text-center text-xs text-[#9E9E8A]/60">아이디 / 비밀번호 찾기</p>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 2. 회원가입
// ────────────────────────────────────────────────────────────
function SignUpScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="회원가입" back />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-4">
          <div>
            <Label>아이디</Label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#EDE7D8] rounded-xl px-4 py-3 text-sm text-[#1C1A16] placeholder-[#9E9E8A] border border-black/8 outline-none"
                placeholder="영문, 숫자 4~20자"
              />
              <button className="bg-[#2D4A3E] text-[#FDFBF4] rounded-xl px-4 text-xs font-medium whitespace-nowrap">
                중복확인
              </button>
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check size={11} /> 사용 가능한 아이디입니다.
            </p>
          </div>

          <div>
            <Label>비밀번호</Label>
            <Field placeholder="영문+숫자+특수문자 8자 이상" type="password" right={<Eye size={16} className="text-[#9E9E8A]" />} />
          </div>

          <div>
            <Label>비밀번호 확인</Label>
            <Field placeholder="비밀번호를 다시 입력하세요" type="password" right={<EyeOff size={16} className="text-[#9E9E8A]" />} />
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <X size={11} /> 비밀번호가 일치하지 않습니다.
            </p>
          </div>

          <div>
            <Label>닉네임</Label>
            <Field placeholder="한글, 영문 2~10자" />
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            {[
              { req: true, text: "서비스 이용약관 동의", checked: true },
              { req: true, text: "개인정보 수집·이용 동의", checked: false },
              { req: false, text: "마케팅 정보 수신 동의 (선택)", checked: false },
            ].map(({ req, text, checked }) => (
              <label key={text} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-[#2D4A3E] border-[#2D4A3E]" : "border-[#DDD7CB]"}`}>
                  {checked && <Check size={10} className="text-white" />}
                </div>
                <span className="text-xs text-[#1C1A16]">
                  {req && <span className="text-[#8B5E3C] mr-0.5">[필수]</span>}
                  {text}
                </span>
                <ChevronRight size={12} className="ml-auto text-[#9E9E8A]" />
              </label>
            ))}
          </div>

          <div className="pt-2">
            <PrimaryBtn>가입 완료</PrimaryBtn>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 3. 마이페이지
// ────────────────────────────────────────────────────────────
function MyPageScreen() {
  const [tab, setTab] = useState("records");
  const tabs = [["records","독서기록"],["bookmarks","북마크"],["reviews","한줄평"],["comments","댓글"],["groups","독서그룹"]];
  const books = [
    { title: "82년생 김지영", author: "조남주", date: "2024.11.03" },
    { title: "채식주의자", author: "한강", date: "2024.10.15" },
    { title: "아몬드", author: "손원평", date: "2024.09.22" },
  ];
  return (
    <Frame>
      <SB />
      <NavBar title="마이페이지" right={<Settings size={18} className="text-[#2D4A3E]" />} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#2D4A3E]/20 flex items-center justify-center">
            <User size={28} className="text-[#2D4A3E]" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="font-serif text-lg text-[#1C1A16]">책벌레김민준</div>
            <div className="text-xs text-[#9E9E8A] mt-0.5">@reader_kmj</div>
          </div>
          <button className="border border-[#2D4A3E]/40 text-[#2D4A3E] text-xs rounded-lg px-3 py-1.5">수정</button>
        </div>

        <div className="mx-5 mb-5 bg-[#2D4A3E] rounded-2xl py-4 grid grid-cols-3">
          {[["42","완독"],["128","독서일"],["7","모임"]].map(([v,l]) => (
            <div key={l} className="text-center">
              <div className="font-serif text-2xl text-[#FDFBF4] font-medium">{v}</div>
              <div className="text-[10px] text-[#FDFBF4]/60 mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        <div className="flex border-b border-black/8 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3.5 py-3 text-xs whitespace-nowrap font-medium border-b-2 transition-colors ${tab === id ? "border-[#2D4A3E] text-[#2D4A3E]" : "border-transparent text-[#9E9E8A]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          {books.map((b) => (
            <div key={b.title} className="flex items-center gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
              <div className="w-10 h-14 bg-[#2D4A3E]/15 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-[#1C1A16]">{b.title}</div>
                <div className="text-xs text-[#9E9E8A]">{b.author}</div>
                <div className="text-[10px] text-[#9E9E8A] mt-0.5">{b.date}</div>
              </div>
              <span className="text-[10px] bg-[#2D4A3E]/10 text-[#2D4A3E] rounded-full px-2 py-0.5 shrink-0">완독</span>
            </div>
          ))}
        </div>

        <div className="border-t border-black/6 mx-5 mt-2">
          {[
            { Icon: Lock, label: "비밀번호 변경", danger: false },
            { Icon: Bell, label: "알림 설정", danger: false },
            { Icon: Trash2, label: "회원탈퇴", danger: true },
          ].map(({ Icon, label, danger }) => (
            <button key={label} className="w-full flex items-center justify-between py-3.5 border-b border-black/6 last:border-none">
              <div className="flex items-center gap-3">
                <Icon size={16} className={danger ? "text-red-400" : "text-[#9E9E8A]"} />
                <span className={`text-sm ${danger ? "text-red-500" : "text-[#1C1A16]"}`}>{label}</span>
              </div>
              <ChevronRight size={14} className="text-[#9E9E8A]" />
            </button>
          ))}
        </div>
      </div>
      <TabBar active="profile" />
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 4. 프로필 수정
// ────────────────────────────────────────────────────────────
function EditProfileScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="프로필 수정" back right={<button className="text-xs font-medium text-[#2D4A3E]">저장</button>} />
      <div className="flex-1 px-6 pt-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#2D4A3E]/20 flex items-center justify-center">
              <User size={36} className="text-[#2D4A3E]" strokeWidth={1.5} />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#2D4A3E] rounded-full flex items-center justify-center shadow-md">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <span className="text-xs text-[#9E9E8A]">사진 변경</span>
        </div>
        <div>
          <Label>닉네임</Label>
          <Field placeholder="한글, 영문 2~10자" value="책벌레김민준" />
          <p className="text-xs text-[#9E9E8A] mt-1">한글, 영문 2~10자</p>
        </div>
        <PrimaryBtn>저장하기</PrimaryBtn>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 5. 비밀번호 변경
// ────────────────────────────────────────────────────────────
function ChangePasswordScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="비밀번호 변경" back />
      <div className="flex-1 px-6 py-5 flex flex-col gap-4">
        {[
          { label: "현재 비밀번호", placeholder: "현재 비밀번호 입력" },
          { label: "새 비밀번호", placeholder: "영문+숫자+특수문자 8자 이상" },
          { label: "새 비밀번호 확인", placeholder: "새 비밀번호를 다시 입력하세요" },
        ].map(({ label, placeholder }) => (
          <div key={label}>
            <Label>{label}</Label>
            <Field placeholder={placeholder} type="password" right={<Eye size={16} className="text-[#9E9E8A]" />} />
          </div>
        ))}
        <div className="mt-2"><PrimaryBtn>변경하기</PrimaryBtn></div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 6. 회원탈퇴
// ────────────────────────────────────────────────────────────
function DeleteAccountScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="회원탈퇴" back />
      <div className="flex-1 px-6 py-5 flex flex-col gap-5">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-700 mb-1.5">탈퇴 전 꼭 확인해주세요</div>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• 모든 독서 기록이 영구 삭제됩니다.</li>
                <li>• 참여 중인 독서 모임에서 탈퇴됩니다.</li>
                <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <Label>비밀번호 확인</Label>
          <Field placeholder="비밀번호를 입력하세요" type="password" right={<Eye size={16} className="text-[#9E9E8A]" />} />
        </div>
        <label className="flex items-start gap-2.5">
          <div className="w-4 h-4 rounded border border-red-300 shrink-0 mt-0.5" />
          <span className="text-xs text-[#1C1A16]">위 내용을 모두 확인했으며, 탈퇴에 동의합니다.</span>
        </label>
        <button className="w-full bg-red-500 text-white rounded-xl py-3.5 text-sm font-medium">탈퇴하기</button>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 7. 책 검색
// ────────────────────────────────────────────────────────────
function BookSearchScreen() {
  const books = [
    { title: "채식주의자", author: "한강", pub: "창비", year: "2007", rating: "4.8" },
    { title: "소년이 온다", author: "한강", pub: "창비", year: "2014", rating: "4.9" },
    { title: "흰", author: "한강", pub: "문학동네", year: "2018", rating: "4.7" },
    { title: "작별하지 않는다", author: "한강", pub: "문학동네", year: "2021", rating: "4.6" },
    { title: "희랍어 시간", author: "한강", pub: "문학동네", year: "2011", rating: "4.5" },
  ];
  return (
    <Frame>
      <SB />
      <div className="bg-[#FDFBF4] px-4 pt-2 pb-3 border-b border-black/8 shrink-0">
        <div className="flex items-center gap-2 bg-[#EDE7D8] rounded-xl px-4 py-2.5 border border-black/8">
          <Search size={15} className="text-[#9E9E8A] shrink-0" />
          <input className="flex-1 bg-transparent text-sm text-[#1C1A16] placeholder-[#9E9E8A] outline-none" defaultValue="한강" />
          <X size={14} className="text-[#9E9E8A]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <p className="text-[10px] text-[#9E9E8A] py-3">"한강" 검색 결과 24권</p>
        <div className="flex flex-col gap-2.5">
          {books.map((b) => (
            <div key={b.title} className="flex gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
              <div className="w-10 rounded-lg shrink-0 bg-gradient-to-b from-[#2D4A3E]/35 to-[#2D4A3E]/12 flex items-end justify-center pb-1" style={{ height: 56 }}>
                <span className="text-[8px] text-[#2D4A3E]/60 font-medium text-center leading-tight px-1">{b.title}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#1C1A16] truncate">{b.title}</div>
                <div className="text-xs text-[#9E9E8A] mt-0.5">{b.author} · {b.pub} · {b.year}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="text-[10px] text-[#9E9E8A]">{b.rating}</span>
                </div>
              </div>
              <ChevronRight size={15} className="text-[#9E9E8A] self-center shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 8. 책 상세 / 등록
// ────────────────────────────────────────────────────────────
function BookDetailScreen() {
  const [status, setStatus] = useState<"reading" | "done" | null>(null);
  return (
    <Frame>
      <SB />
      <NavBar title="책 상세" back right={<Heart size={18} className="text-[#9E9E8A]" />} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#2D4A3E]/10 flex items-center justify-center py-8">
          <div className="w-28 h-40 bg-gradient-to-b from-[#2D4A3E]/50 to-[#2D4A3E]/20 rounded-xl shadow-xl flex items-end justify-center pb-3">
            <span className="text-[9px] text-[#2D4A3E]/80 font-medium text-center px-2 leading-tight">채식주의자</span>
          </div>
        </div>
        <div className="px-5 py-5">
          <h1 className="font-serif text-xl text-[#1C1A16] mb-0.5">채식주의자</h1>
          <p className="text-sm text-[#9E9E8A]">한강 · 창비 · 2007 · 247p</p>
          <div className="flex items-center gap-1.5 mt-2 mb-4">
            {[1,2,3,4,5].map((s) => <Star key={s} size={13} className="fill-amber-400 text-amber-400" />)}
            <span className="text-xs font-medium text-[#1C1A16] ml-1">4.8</span>
            <span className="text-xs text-[#9E9E8A]">(2.3만)</span>
          </div>
          <p className="text-sm text-[#1C1A16]/80 leading-relaxed mb-5">
            어느 날 갑자기 채식을 결심한 여자와 그 주변 인물들의 이야기. 폭력과 욕망, 예술과 광기를 섬세하게 탐구한 작품.
          </p>
          <p className="text-xs font-medium text-[#7A7060] mb-2">독서 상태 선택</p>
          <div className="flex gap-2 mb-5">
            {(["reading","done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${status === s ? "bg-[#2D4A3E] text-[#FDFBF4] border-[#2D4A3E]" : "border-[#DDD7CB] text-[#9E9E8A]"}`}
              >
                {s === "reading" ? "읽는 중" : "완독"}
              </button>
            ))}
          </div>
          <PrimaryBtn>내 서재에 추가</PrimaryBtn>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 9. 내 서재
// ────────────────────────────────────────────────────────────
function MyLibraryScreen() {
  const books = ["채식주의자","82년생 김지영","아몬드","소년이 온다","흰","작별하지 않는다","희랍어 시간","인간 실격","데미안"];
  const clrs = ["from-[#2D4A3E]/40 to-[#2D4A3E]/12","from-[#8B5E3C]/40 to-[#8B5E3C]/12","from-[#4A6741]/40 to-[#4A6741]/12","from-[#5C4033]/40 to-[#5C4033]/12","from-[#37474F]/40 to-[#37474F]/12","from-[#4A4A2D]/40 to-[#4A4A2D]/12"];
  return (
    <Frame>
      <SB />
      <NavBar title="내 서재" right={<Search size={18} className="text-[#2D4A3E]" />} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-4 mt-4 bg-[#2D4A3E] rounded-2xl p-5 flex items-center gap-4">
          <div>
            <div className="font-serif text-4xl text-[#FDFBF4] font-medium">42</div>
            <div className="text-[10px] text-[#FDFBF4]/60 mt-0.5">완독한 책</div>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="flex-1">
            <div className="text-[10px] text-[#FDFBF4]/60 mb-1.5">이달의 목표</div>
            <div className="bg-white/20 rounded-full h-1.5 mb-1"><div className="bg-[#FDFBF4] h-1.5 rounded-full w-4/5" /></div>
            <div className="text-[10px] text-[#FDFBF4]/70">4 / 5권 완독</div>
          </div>
        </div>
        <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto">
          {["전체 (42)","읽는 중 (3)","완독 (36)","읽고 싶어요 (3)"].map((f, i) => (
            <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${i === 0 ? "bg-[#2D4A3E] text-white" : "bg-[#EDE7D8] text-[#7A7060]"}`}>{f}</button>
          ))}
        </div>
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {books.map((title, i) => (
            <div key={title} className="flex flex-col">
              <div className={`rounded-xl bg-gradient-to-b ${clrs[i % clrs.length]} relative overflow-hidden`} style={{ aspectRatio: "2/3" }}>
                <div className="absolute inset-0 flex items-end p-2">
                  <span className="text-[8px] text-[#1C1A16]/50 font-medium leading-tight">{title}</span>
                </div>
                {i < 6 && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={8} className="text-white" />
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-[11px] text-[#1C1A16] leading-tight line-clamp-2">{title}</div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="library" />
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 10. 한줄평
// ────────────────────────────────────────────────────────────
function OneLineReviewScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="한줄평" back right={<button className="text-xs font-medium text-[#2D4A3E]">저장</button>} />
      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        <div className="flex gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
          <div className="w-10 h-14 bg-[#2D4A3E]/20 rounded-lg shrink-0" />
          <div>
            <div className="font-medium text-sm text-[#1C1A16]">채식주의자</div>
            <div className="text-xs text-[#9E9E8A]">한강 · 완독 2024.11.15</div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1,2,3,4,5].map((s) => <Star key={s} size={13} className="fill-amber-400 text-amber-400" />)}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Label>한 줄로 표현하는 이 책의 감상</Label>
          <textarea
            className="flex-1 bg-[#EDE7D8]/60 rounded-xl p-4 text-sm text-[#1C1A16] outline-none border border-black/8 resize-none leading-relaxed"
            defaultValue="인간의 욕망과 억압, 그리고 그 사이에서 숨쉬는 존재에 대한 서늘하고도 아름다운 탐구."
          />
          <div className="flex justify-end mt-1"><span className="text-xs text-[#9E9E8A]">42/100자</span></div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 border border-red-300 text-red-500 rounded-xl py-3 text-sm font-medium">삭제</button>
          <button className="flex-1 bg-[#2D4A3E] text-[#FDFBF4] rounded-xl py-3 text-sm font-medium">저장하기</button>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 11. SNS 공유 (진도 시각화 오버레이 포함)
// ────────────────────────────────────────────────────────────
function SNSShareScreen() {
  const [overlayOn, setOverlayOn] = useState(true);
  const [overlayType, setOverlayType] = useState<"gauge" | "bar" | "badge">("badge");
  const progress = 52;
  const r = 16;
  const circumference = 2 * Math.PI * r;

  return (
    <Frame>
      <SB />
      <NavBar title="SNS 공유" back />
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* 미리보기 카드 */}
        <div className="relative bg-[#E8DFC8] rounded-2xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: "1" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#2D4A3E]/12 to-[#8B5E3C]/12" />
          <div className="relative flex flex-col items-center gap-3 py-6">
            <div className="w-20 h-28 bg-[#2D4A3E]/25 rounded-xl shadow-lg" />
            <div className="text-center">
              <div className="font-serif text-lg text-[#1C1A16]">채식주의자</div>
              <div className="text-xs text-[#7A7060]">한강</div>
            </div>
            <div className="text-xs text-[#1C1A16]/70 text-center max-w-[180px] leading-relaxed italic">
              "인간의 욕망과 억압, 그리고 그 사이에서..."
            </div>
            <div className="text-[10px] text-[#9E9E8A] flex items-center gap-1">
              <BookMarked size={10} /><span>READLOG</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 text-2xl">📚</div>
          <div className="absolute bottom-8 left-5 text-xl">✨</div>

          {/* 진도 시각화 오버레이 */}
          {overlayOn && (
            <div className="absolute bottom-4 right-4 cursor-move">
              {overlayType === "gauge" && (
                <svg width="52" height="52" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r={r} fill="rgba(0,0,0,0.45)" />
                  <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                  <circle
                    cx="20" cy="20" r={r} fill="none" stroke="white" strokeWidth="3"
                    strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                    strokeLinecap="round" transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{progress}%</text>
                </svg>
              )}
              {overlayType === "bar" && (
                <div className="bg-black/50 rounded-lg px-2.5 py-1.5">
                  <div className="text-[10px] text-white/70 mb-1">독서 진도</div>
                  <div className="bg-white/30 rounded-full h-1.5 w-20">
                    <div className="bg-white h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-[10px] text-white mt-0.5 font-medium">{progress}%</div>
                </div>
              )}
              {overlayType === "badge" && (
                <div className="bg-black/50 rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-[10px] text-white font-medium">p.128 / 247</div>
                  <div className="text-[8px] text-white/60">읽는 중</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 이모지 스티커 */}
        <div>
          <p className="text-xs font-medium text-[#7A7060] mb-2">이모지 스티커 추가</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["📚","✨","🌿","☕","🎭","💫","📖","🌸","🦋","🍃"].map((e) => (
              <button key={e} className="w-10 h-10 bg-[#EDE7D8] rounded-xl text-lg shrink-0 flex items-center justify-center">{e}</button>
            ))}
          </div>
        </div>

        {/* 진도 시각화 오버레이 컨트롤 */}
        <div className="bg-[#FDFBF4] rounded-xl p-4 border border-black/6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-[#1C1A16]">진도 시각화 오버레이</div>
              <div className="text-xs text-[#9E9E8A] mt-0.5">저장된 독서 진도를 카드에 표시</div>
            </div>
            <button
              onClick={() => setOverlayOn(!overlayOn)}
              className={`w-12 h-6 rounded-full transition-colors relative ${overlayOn ? "bg-[#2D4A3E]" : "bg-[#DDD7CB]"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${overlayOn ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
          {overlayOn && (
            <>
              <div className="flex gap-2 mb-2">
                {(["gauge", "bar", "badge"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOverlayType(t)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-medium border transition-all ${overlayType === t ? "bg-[#2D4A3E] text-white border-[#2D4A3E]" : "border-[#DDD7CB] text-[#9E9E8A]"}`}
                  >
                    {t === "gauge" ? "원형 게이지" : t === "bar" ? "진행 바" : "텍스트 뱃지"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#9E9E8A]">미리보기 위에서 드래그해 위치·크기를 조정할 수 있어요.</p>
            </>
          )}
        </div>

        {/* 코멘트 */}
        <div>
          <Label>코멘트</Label>
          <textarea
            className="w-full bg-[#EDE7D8]/60 rounded-xl p-3 text-sm text-[#1C1A16] placeholder-[#9E9E8A] outline-none border border-black/8 resize-none"
            rows={2}
            defaultValue="이 책을 읽고 많은 생각을 하게 됐어요. #독서 #한강 #채식주의자 #readlog"
          />
        </div>
        <button className="flex items-center gap-2 border-2 border-dashed border-[#DDD7CB] rounded-xl py-3 px-4 text-[#9E9E8A]">
          <Camera size={16} /><span className="text-sm">내 사진 업로드</span>
        </button>
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3.5 text-sm font-medium flex items-center justify-center gap-2">
          <Share2 size={16} />Instagram에 공유하기
        </button>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 12. 독서모임 목록
// ────────────────────────────────────────────────────────────
function GroupListScreen() {
  const groups = [
    { name: "한강 읽기 모임", book: "채식주의자", members: 5, max: 8, progress: 65, days: "D-12", pub: true },
    { name: "SF독서클럽", book: "파친코", members: 6, max: 6, progress: 30, days: "D-23", pub: false },
    { name: "고전문학탐구대", book: "데미안", members: 4, max: 10, progress: 90, days: "D-3", pub: true },
  ];
  return (
    <Frame>
      <SB />
      <NavBar title="독서모임" right={<Plus size={20} className="text-[#2D4A3E]" />} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          {["참여 중","추천 모임"].map((t, i) => (
            <button key={t} className={`px-3 py-1.5 rounded-full text-xs font-medium ${i === 0 ? "bg-[#2D4A3E] text-white" : "bg-[#EDE7D8] text-[#7A7060]"}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.name} className="bg-[#FDFBF4] rounded-2xl p-4 border border-black/6">
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="font-medium text-sm text-[#1C1A16]">{g.name}</div>
                  <div className="text-xs text-[#9E9E8A] mt-0.5">📖 {g.book}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.pub ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {g.pub ? "공개" : "비공개"}
                  </span>
                  <span className="text-[10px] text-[#9E9E8A]">{g.days}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs text-[#9E9E8A]">
                  <Users size={11} /><span>{g.members}/{g.max}명</span>
                </div>
                <span className="text-xs font-medium text-[#2D4A3E]">{g.progress}%</span>
              </div>
              <div className="bg-[#EDE7D8] rounded-full h-1.5">
                <div className="bg-[#2D4A3E] h-1.5 rounded-full" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-[#DDD7CB] rounded-2xl py-4 flex items-center justify-center gap-2 text-[#9E9E8A] text-sm">
            <LinkIcon size={15} />초대 코드로 참가하기
          </button>
        </div>
      </div>
      <TabBar active="groups" />
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 13. 모임 개설
// ────────────────────────────────────────────────────────────
function CreateGroupScreen() {
  const [isPublic, setIsPublic] = useState(true);
  return (
    <Frame>
      <SB />
      <NavBar title="모임 개설" back right={<button className="text-xs font-medium text-[#2D4A3E]">완료</button>} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        <div>
          <Label>모임명</Label>
          <Field placeholder="예: 한강 읽기 모임" />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-black/8">
          <div>
            <div className="text-sm font-medium text-[#1C1A16]">공개 여부</div>
            <div className="text-xs text-[#9E9E8A] mt-0.5">{isPublic ? "누구나 참가 신청 가능" : "초대 코드로만 참가 가능"}</div>
          </div>
          <button onClick={() => setIsPublic(!isPublic)} className={`w-12 h-6 rounded-full transition-colors relative ${isPublic ? "bg-[#2D4A3E]" : "bg-[#DDD7CB]"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
        <div>
          <Label>최대 인원</Label>
          <div className="flex gap-2">
            {[4,6,8,10,12].map((n) => (
              <button key={n} className={`flex-1 py-2 rounded-xl text-xs font-medium border ${n === 8 ? "bg-[#2D4A3E] text-white border-[#2D4A3E]" : "border-[#DDD7CB] text-[#9E9E8A]"}`}>{n}명</button>
            ))}
          </div>
        </div>
        <div>
          <Label>독서 기간</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#EDE7D8] rounded-xl px-3 py-2.5 border border-black/8 flex items-center gap-2">
              <Calendar size={13} className="text-[#9E9E8A]" />
              <span className="text-sm text-[#1C1A16]">2024.12.01</span>
            </div>
            <span className="text-[#9E9E8A] text-sm">~</span>
            <div className="flex-1 bg-[#EDE7D8] rounded-xl px-3 py-2.5 border border-black/8 flex items-center gap-2">
              <Calendar size={13} className="text-[#9E9E8A]" />
              <span className="text-sm text-[#1C1A16]">2024.12.31</span>
            </div>
          </div>
        </div>
        <div>
          <Label>진행 도서</Label>
          <button className="w-full border-2 border-dashed border-[#DDD7CB] rounded-xl py-4 flex items-center justify-center gap-2 text-[#9E9E8A]">
            <Plus size={15} /><span className="text-sm">도서 검색 및 선택</span>
          </button>
        </div>
        <PrimaryBtn>모임 개설하기</PrimaryBtn>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 14. 모임 참가
// ────────────────────────────────────────────────────────────
function JoinGroupScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="모임 참가" back />
      <div className="flex-1 px-6 py-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-[#2D4A3E]/10 rounded-full flex items-center justify-center mb-6">
          <LinkIcon size={32} className="text-[#2D4A3E]" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-xl text-[#1C1A16] mb-2 text-center">모임에 참가하기</h2>
        <p className="text-sm text-[#9E9E8A] text-center mb-8 leading-relaxed">
          초대 코드 또는 링크를 입력하여<br />독서 모임에 참가하세요.
        </p>
        <div className="w-full mb-4">
          <Label>초대 코드 / 링크</Label>
          <Field placeholder="예: RDLG-A7B3 또는 invite 링크" />
        </div>
        <div className="w-full bg-[#FDFBF4] rounded-2xl p-4 border border-[#2D4A3E]/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D4A3E]/12 rounded-xl flex items-center justify-center">
              <BookOpen size={16} className="text-[#2D4A3E]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-medium text-sm text-[#1C1A16]">한강 읽기 모임</div>
              <div className="text-xs text-[#9E9E8A]">5/8명 · 채식주의자 · D-12</div>
            </div>
          </div>
        </div>
        <PrimaryBtn>참가하기</PrimaryBtn>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 15. 모임 홈
// ────────────────────────────────────────────────────────────
function GroupHomeScreen() {
  const [tab, setTab] = useState("progress");
  const members = [
    { name: "책벌레김민준", progress: 87, chapter: "Chapter 3", time: "1시간 전" },
    { name: "소설덕후이소영", progress: 65, chapter: "Chapter 2", time: "3시간 전" },
    { name: "독서왕박철수", progress: 45, chapter: "Chapter 2", time: "어제" },
    { name: "활자중독자", progress: 100, chapter: "완독!", time: "2일 전" },
    { name: "느린독서가", progress: 20, chapter: "Chapter 1", time: "3일 전" },
  ];
  return (
    <Frame>
      <SB />
      <NavBar title="한강 읽기 모임" back right={<Settings size={18} className="text-[#2D4A3E]" />} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-[#2D4A3E] px-5 py-5 text-[#FDFBF4]">
          <div className="flex gap-4 items-start">
            <div className="w-14 h-20 bg-white/20 rounded-xl shrink-0" />
            <div className="flex-1">
              <div className="font-serif text-lg font-medium">채식주의자</div>
              <div className="text-xs text-[#FDFBF4]/60 mt-0.5">한강 · 창비</div>
              <div className="text-[10px] text-[#FDFBF4]/50 mt-1.5">2024.12.01 – 12.31 · D-12</div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {["M","S","J","A","K"].map((c) => (
                <div key={c} className="w-7 h-7 bg-white/30 rounded-full border-2 border-[#2D4A3E] flex items-center justify-center text-[10px] font-bold">{c}</div>
              ))}
            </div>
            <span className="text-xs text-[#FDFBF4]/60 ml-1">5/8명</span>
            <button className="ml-auto text-xs bg-white/20 rounded-lg px-3 py-1.5">초대하기</button>
          </div>
        </div>
        <div className="flex border-b border-black/8 bg-[#FDFBF4]">
          {[["progress","진도 현황"],["comments","댓글"],["settings","설정"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${tab === id ? "border-[#2D4A3E] text-[#2D4A3E]" : "border-transparent text-[#9E9E8A]"}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === "progress" && (
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-[#7A7060]">멤버별 진도 현황</span>
              <button className="text-xs text-[#2D4A3E] font-medium">+ 진도 공유</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {members.map(({ name, progress, chapter, time }) => (
                <div key={name} className="bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#2D4A3E]/15 rounded-full flex items-center justify-center text-xs font-semibold text-[#2D4A3E]">{name[0]}</div>
                      <div>
                        <div className="text-xs font-medium text-[#1C1A16]">{name}</div>
                        <div className="text-[10px] text-[#9E9E8A]">{chapter} · {time}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${progress === 100 ? "text-green-600" : "text-[#2D4A3E]"}`}>{progress}%</span>
                  </div>
                  <div className="bg-[#EDE7D8] rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${progress === 100 ? "bg-green-500" : "bg-[#2D4A3E]"}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <TabBar active="groups" />
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 16. 멤버 초대
// ────────────────────────────────────────────────────────────
function InviteScreen() {
  const qrPattern = [0,1,5,6,10,12,14,18,19,20,23,24,3,7,17,21,8,16];
  return (
    <Frame>
      <SB />
      <NavBar title="멤버 초대" back />
      <div className="flex-1 px-6 py-5 flex flex-col">
        <div className="text-center mb-6">
          <div className="font-serif text-base text-[#1C1A16] mb-0.5">한강 읽기 모임</div>
          <div className="text-xs text-[#9E9E8A]">5/8명 참여 중</div>
        </div>
        <div className="bg-[#FDFBF4] rounded-2xl p-6 border border-black/8 mb-5 flex flex-col items-center gap-5">
          <div className="w-32 h-32 bg-[#EDE7D8] rounded-xl grid grid-cols-5 grid-rows-5 gap-1 p-2.5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className={`rounded-[2px] ${qrPattern.includes(i) ? "bg-[#2D4A3E]" : "bg-transparent"}`} />
            ))}
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#9E9E8A] mb-1">초대 코드</p>
            <div className="font-mono text-2xl font-bold text-[#2D4A3E] tracking-[0.25em]">RDLG-4782</div>
            <p className="text-[10px] text-[#9E9E8A] mt-1">24시간 유효</p>
          </div>
        </div>
        <div className="bg-[#EDE7D8]/60 rounded-xl px-4 py-3 border border-black/8 flex items-center gap-2 mb-4">
          <LinkIcon size={13} className="text-[#9E9E8A] shrink-0" />
          <span className="text-xs text-[#9E9E8A] flex-1 truncate">readlog.app/invite/RDLG-4782</span>
          <button><Copy size={14} className="text-[#2D4A3E]" /></button>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 border border-[#DDD7CB] text-[#7A7060] rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2">
            <Copy size={14} />링크 복사
          </button>
          <button className="flex-1 bg-[#2D4A3E] text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2">
            <Share2 size={14} />공유하기
          </button>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 17. 진도 공유
// ────────────────────────────────────────────────────────────
function ProgressShareScreen() {
  return (
    <Frame>
      <SB />
      <NavBar title="진도 공유" back right={<button className="text-xs font-medium text-[#2D4A3E]">공유</button>} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        <div className="flex gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6 items-center">
          <div className="w-10 h-14 bg-[#2D4A3E]/20 rounded-lg shrink-0" />
          <div>
            <div className="font-medium text-sm text-[#1C1A16]">채식주의자</div>
            <div className="text-xs text-[#9E9E8A]">한강 · 한강 읽기 모임</div>
          </div>
        </div>
        <div>
          <Label>진도 입력 방식</Label>
          <div className="flex gap-2 mb-3">
            {["페이지","챕터","퍼센트"].map((t, i) => (
              <button key={t} className={`flex-1 py-2 rounded-xl text-xs font-medium border ${i === 0 ? "bg-[#2D4A3E] text-white border-[#2D4A3E]" : "border-[#DDD7CB] text-[#9E9E8A]"}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input className="flex-1 bg-[#EDE7D8] rounded-xl px-4 py-3 text-center text-2xl font-serif text-[#1C1A16] border border-black/8 outline-none" defaultValue="128" />
            <span className="text-sm text-[#9E9E8A]">/ 247 페이지</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-[#7A7060] mb-2">
            <span>진도율</span>
            <span className="font-medium text-[#2D4A3E]">52%</span>
          </div>
          <div className="bg-[#EDE7D8] rounded-full h-3 overflow-hidden">
            <div className="bg-[#2D4A3E] h-3 rounded-full w-[52%]" />
          </div>
        </div>
        <div>
          <Label>현재 챕터 (선택)</Label>
          <Field placeholder="예: Chapter 2 - 몽고반점" />
        </div>
        <div>
          <Label>메모 (선택)</Label>
          <textarea className="w-full bg-[#EDE7D8]/60 rounded-xl p-3 text-sm text-[#1C1A16] placeholder-[#9E9E8A] outline-none border border-black/8 resize-none" rows={3} placeholder="이 부분에서 느낀 점을 기록해보세요..." />
        </div>
        <PrimaryBtn>진도 공유하기</PrimaryBtn>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 18. 공유 책 댓글
// ────────────────────────────────────────────────────────────
function CommentsScreen() {
  const [spoiler, setSpoiler] = useState(false);
  return (
    <Frame>
      <SB />
      <NavBar title="공유 책 댓글" back />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="text-xs text-[#9E9E8A] mb-3 flex items-center gap-1">
          <BookOpen size={11} />
          <span>채식주의자 · Chapter 2 이후 포함</span>
          <span className="ml-auto text-[10px] bg-[#EDE7D8] rounded-full px-2 py-0.5">댓글 12개</span>
        </div>
        <div className="flex flex-col gap-3">
          {/* 일반 댓글 */}
          <div className="bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#2D4A3E]/15 rounded-full flex items-center justify-center text-[11px] font-semibold text-[#2D4A3E]">M</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#1C1A16]">책벌레김민준</div>
                <div className="text-[10px] text-[#9E9E8A]">2시간 전 · p.87</div>
              </div>
              <MoreVertical size={14} className="text-[#9E9E8A]" />
            </div>
            <p className="text-xs text-[#1C1A16] leading-relaxed">영혜의 꿈 장면이 정말 인상적이었어요. 식물이 되고 싶다는 욕망이 억압에 대한 저항처럼 느껴졌어요.</p>
            <div className="flex items-center gap-1 mt-2">
              {["🌿","💭","❤️"].map((e) => <button key={e} className="text-xs bg-[#EDE7D8] rounded-full px-2 py-0.5">{e}</button>)}
              <span className="ml-auto text-[10px] text-[#9E9E8A]">❤️ 3</span>
            </div>
          </div>
          {/* 스포일러 댓글 */}
          <div className="bg-[#FDFBF4] rounded-xl p-3 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-[11px] font-semibold text-amber-700">S</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-[#1C1A16]">소설덕후이소영</div>
                <div className="text-[10px] text-amber-600">스포일러 포함 · p.156</div>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">⚠️ 스포일러</span>
            </div>
            <div className="relative">
              <p className={`text-xs text-[#1C1A16] leading-relaxed transition-all ${spoiler ? "" : "blur-sm select-none"}`}>
                결말에서 영혜가 완전히 식물처럼 변해가는 과정이 너무 충격적이었어요. 언니의 시선에서 바라보는 마지막 장면이 가슴 아팠어요.
              </p>
              {!spoiler && (
                <button onClick={() => setSpoiler(true)} className="absolute inset-0 flex items-center justify-center text-xs text-amber-700 font-medium">
                  탭하여 스포일러 보기
                </button>
              )}
            </div>
          </div>
          {/* 인용 댓글 */}
          <div className="bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#2D4A3E]/15 rounded-full flex items-center justify-center text-[11px] font-semibold text-[#2D4A3E]">J</div>
              <div>
                <div className="text-xs font-medium text-[#1C1A16]">독서왕박철수</div>
                <div className="text-[10px] text-[#9E9E8A]">어제 · p.43</div>
              </div>
            </div>
            <div className="bg-[#EDE7D8]/70 border-l-2 border-[#8B5E3C] rounded-r-lg px-3 py-2 mb-2">
              <p className="text-xs text-[#7A7060] italic">"나는 꿈을 꾸었어. 내가 나무가 되는 꿈."</p>
              <span className="text-[10px] text-[#9E9E8A]">— 채식주의자, p.43</span>
            </div>
            <p className="text-xs text-[#1C1A16] leading-relaxed">이 문장 하나로 모든 것이 시작되는 것 같아요.</p>
          </div>
        </div>
      </div>
      {/* 입력창 */}
      <div className="px-4 py-3 border-t border-black/8 bg-[#FDFBF4] shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-[#EDE7D8]/50 rounded-xl px-3 py-2 border border-black/8">
            <input className="w-full bg-transparent text-sm text-[#1C1A16] placeholder-[#9E9E8A] outline-none" placeholder="댓글 입력..." />
            <div className="flex items-center gap-2 mt-1.5">
              <button className="text-[10px] text-[#9E9E8A] flex items-center gap-0.5"><AlertTriangle size={9} />스포일러</button>
              <button className="text-[10px] text-[#9E9E8A] ml-1">원문 인용</button>
              <button className="ml-auto"><Smile size={14} className="text-[#9E9E8A]" /></button>
            </div>
          </div>
          <button className="w-9 h-9 bg-[#2D4A3E] rounded-xl flex items-center justify-center shrink-0">
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 19. 모임 설정
// ────────────────────────────────────────────────────────────
function GroupSettingsScreen() {
  const memberList = [
    { name: "책벌레김민준", role: "방장", can: false },
    { name: "소설덕후이소영", role: "멤버", can: true },
    { name: "독서왕박철수", role: "멤버", can: true },
    { name: "활자중독자", role: "멤버", can: true },
    { name: "느린독서가", role: "멤버", can: true },
  ];
  return (
    <Frame>
      <SB />
      <NavBar title="모임 설정" back />
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#9E9E8A] uppercase tracking-wider mb-3">기본 정보</p>
          <div className="bg-[#FDFBF4] rounded-xl border border-black/6 divide-y divide-black/6">
            {[["모임명","한강 읽기 모임"],["공개 여부","공개"],["최대 인원","8명"],["독서 기간","12.01 ~ 12.31"]].map(([l,v]) => (
              <div key={l} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1C1A16]">{l}</span>
                <div className="flex items-center gap-1 text-[#9E9E8A]">
                  <span className="text-sm">{v}</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-2">
          <p className="text-[10px] font-semibold text-[#9E9E8A] uppercase tracking-wider mb-3">챕터별 목표</p>
          <div className="bg-[#FDFBF4] rounded-xl border border-black/6 divide-y divide-black/6">
            {[["Chapter 1","~ 12.10"],["Chapter 2","~ 12.20"],["Chapter 3 (완독)","~ 12.31"]].map(([ch, due]) => (
              <div key={ch} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[#1C1A16]">{ch}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#9E9E8A]">{due}</span>
                  <Edit2 size={12} className="text-[#2D4A3E]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-[#9E9E8A] uppercase tracking-wider mb-3">멤버 관리</p>
          <div className="bg-[#FDFBF4] rounded-xl border border-black/6 divide-y divide-black/6">
            {memberList.map(({ name, role, can }) => (
              <div key={name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-[#2D4A3E]/10 rounded-full flex items-center justify-center text-xs font-semibold text-[#2D4A3E] shrink-0">{name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#1C1A16] truncate">{name}</div>
                  <div className="text-[10px] text-[#9E9E8A]">{role}</div>
                </div>
                {can && (
                  <div className="flex gap-1 shrink-0">
                    <button className="text-[11px] text-[#2D4A3E] border border-[#2D4A3E]/30 rounded-lg px-2 py-1">위임</button>
                    <button className="text-[11px] text-red-500 border border-red-200 rounded-lg px-2 py-1">강퇴</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 pb-8">
          <button className="w-full border border-red-200 text-red-500 rounded-xl py-3 text-sm font-medium">모임 삭제</button>
        </div>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 20. 메인 홈
// ────────────────────────────────────────────────────────────
function MainHomeScreen() {
  const [hasGroups, setHasGroups] = useState(true);
  return (
    <Frame>
      <SB />
      {/* 홈 전용 헤더 — 공용 NavBar 미사용 */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#FDFBF4] border-b border-black/8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#2D4A3E] rounded-lg flex items-center justify-center">
            <BookMarked size={12} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="font-serif text-base tracking-widest text-[#1C1A16]">READLOG</span>
        </div>
        <Bell size={20} className="text-[#7A7060]" strokeWidth={1.5} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* 독서 현황 카드 */}
        <div className="bg-[#2D4A3E] rounded-2xl p-5 text-[#FDFBF4]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#FDFBF4]/60 mb-1">이번 달 독서 현황</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-4xl font-medium">4</span>
                <span className="text-sm text-[#FDFBF4]/70">권 완독</span>
              </div>
            </div>
            <button className="text-xs text-[#FDFBF4]/60 flex items-center gap-0.5">
              더보기 <ChevronRight size={12} />
            </button>
          </div>
          {/* 읽는 중인 책 */}
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-14 bg-white/20 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#FDFBF4] truncate">채식주의자</div>
              <div className="text-xs text-[#FDFBF4]/60 mb-2">한강 · 읽는 중</div>
              <div className="bg-white/20 rounded-full h-1.5">
                <div className="bg-[#FDFBF4] h-1.5 rounded-full w-[52%]" />
              </div>
              <div className="text-[10px] text-[#FDFBF4]/50 mt-1">128 / 247p · 52%</div>
            </div>
          </div>
        </div>

        {/* 모임 진도 미리보기 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base text-[#1C1A16]">모임 진도 미리보기</h3>
            <button className="text-xs text-[#2D4A3E] flex items-center gap-0.5">
              더보기 <ChevronRight size={12} />
            </button>
          </div>

          {/* 상태 분기 토글 (와이어프레임 시연용) */}
          <div className="flex gap-2 mb-3">
            {[
              { val: true, label: "모임 있음" },
              { val: false, label: "빈 상태" },
            ].map(({ val, label }) => (
              <button
                key={label}
                onClick={() => setHasGroups(val)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium ${hasGroups === val ? "bg-[#2D4A3E] text-white" : "bg-[#EDE7D8] text-[#7A7060]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {hasGroups ? (
            <div className="flex flex-col gap-3">
              {[
                { name: "한강 읽기 모임", book: "채식주의자", progress: 65, members: 5, days: "D-12" },
                { name: "고전문학탐구대", book: "데미안", progress: 90, members: 4, days: "D-3" },
              ].map((g) => (
                <div key={g.name} className="bg-[#FDFBF4] rounded-2xl p-4 border border-black/6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm text-[#1C1A16]">{g.name}</div>
                      <div className="text-xs text-[#9E9E8A] mt-0.5">📖 {g.book}</div>
                    </div>
                    <span className="text-[10px] text-[#9E9E8A]">{g.days}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 text-xs text-[#9E9E8A]">
                      <Users size={11} /><span>{g.members}명</span>
                    </div>
                    <span className="text-xs font-medium text-[#2D4A3E]">{g.progress}%</span>
                  </div>
                  <div className="bg-[#EDE7D8] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${g.progress === 100 ? "bg-green-500" : "bg-[#2D4A3E]"}`}
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 빈 상태 */
            <div className="bg-[#FDFBF4] rounded-2xl p-8 border border-black/6 flex flex-col items-center text-center">
              <div className="text-4xl mb-3">📚</div>
              <div className="font-serif text-base text-[#1C1A16] mb-1">참여 중인 모임이 없어요</div>
              <p className="text-xs text-[#9E9E8A] mb-5 leading-relaxed">독서 모임을 만들거나 참가해서<br />함께 책을 읽어보세요.</p>
              <button className="bg-[#2D4A3E] text-[#FDFBF4] rounded-xl px-5 py-2.5 text-sm font-medium">모임 찾아보기</button>
            </div>
          )}
        </div>
      </div>

      <TabBar active="home" />
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// 21. 독서 진도 입력
// ────────────────────────────────────────────────────────────
function ReadingProgressScreen() {
  const [method, setMethod] = useState<"page" | "percent">("page");
  const [currentPage, setCurrentPage] = useState(128);
  const totalPages = 247;
  const percent = Math.min(100, Math.round((currentPage / totalPages) * 100));

  const history = [
    { page: 128, percent: 52, date: "2024.12.14 오후 3:21" },
    { page: 87, percent: 35, date: "2024.12.12 오전 11:05" },
    { page: 45, percent: 18, date: "2024.12.10 오후 8:43" },
  ];

  return (
    <Frame>
      <SB />
      <NavBar title="독서 진도 입력" back right={<button className="text-xs font-medium text-[#2D4A3E]">저장</button>} />
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* 책 헤더 */}
        <div className="flex gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6 items-center">
          <div className="w-10 h-14 bg-[#2D4A3E]/20 rounded-lg shrink-0" />
          <div>
            <div className="font-medium text-sm text-[#1C1A16]">채식주의자</div>
            <div className="text-xs text-[#9E9E8A]">한강 · 총 {totalPages}페이지</div>
          </div>
        </div>

        {/* 입력 방식 선택 */}
        <div>
          <Label>진도 입력 방식</Label>
          <div className="flex gap-2 mb-4">
            {(["page", "percent"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${method === m ? "bg-[#2D4A3E] text-white border-[#2D4A3E]" : "border-[#DDD7CB] text-[#9E9E8A]"}`}
              >
                {m === "page" ? "페이지 입력" : "퍼센트(%)"}
              </button>
            ))}
          </div>

          {method === "page" ? (
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-[#EDE7D8] rounded-xl px-4 py-3 text-center text-2xl font-serif text-[#1C1A16] border border-black/8 outline-none"
                type="number"
                min={0}
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(totalPages, Math.max(0, parseInt(e.target.value) || 0)))}
              />
              <span className="text-sm text-[#9E9E8A] whitespace-nowrap">/ {totalPages} 페이지</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-[#EDE7D8] rounded-xl px-4 py-3 text-center text-2xl font-serif text-[#1C1A16] border border-black/8 outline-none"
                type="number"
                value={percent}
                readOnly
              />
              <span className="text-sm text-[#9E9E8A]">%</span>
            </div>
          )}
        </div>

        {/* 즉시 시각화 진행 바 — 가변 너비, min 4px / max 100% */}
        <div>
          <div className="flex justify-between text-xs text-[#7A7060] mb-2">
            <span>진도율</span>
            <span className="font-medium text-[#2D4A3E]">{percent}%</span>
          </div>
          <div className="bg-[#EDE7D8] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#2D4A3E] h-3 rounded-full transition-all"
              style={{ width: percent > 0 ? `max(4px, ${percent}%)` : "0" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#9E9E8A] mt-1">
            <span>0p</span>
            <span>{totalPages}p</span>
          </div>
        </div>

        {/* 이전 진도 타임라인 */}
        <div>
          <Label>이전 기록</Label>
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#FDFBF4] rounded-xl p-3 border border-black/6">
                <div className="w-9 h-9 bg-[#2D4A3E]/10 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#2D4A3E] shrink-0">
                  {h.percent}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#1C1A16]">p.{h.page} / {totalPages}</div>
                  <div className="text-[10px] text-[#9E9E8A]">{h.date}</div>
                </div>
                <div className="bg-[#EDE7D8] rounded-full h-1 w-16 shrink-0">
                  <div className="bg-[#2D4A3E] h-1 rounded-full" style={{ width: `${h.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <PrimaryBtn>저장하기</PrimaryBtn>
      </div>
    </Frame>
  );
}

// ────────────────────────────────────────────────────────────
// SCREEN REGISTRY
// ────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "home",
    label: "메인 홈",
    screens: [
      { id: "main-home", label: "메인 홈" },
    ],
  },
  {
    id: "auth",
    label: "회원관리",
    screens: [
      { id: "login", label: "로그인" },
      { id: "signup", label: "회원가입" },
      { id: "mypage", label: "마이페이지" },
      { id: "edit-profile", label: "프로필 수정" },
      { id: "change-password", label: "비밀번호 변경" },
      { id: "delete-account", label: "회원탈퇴" },
    ],
  },
  {
    id: "plan",
    label: "독서 플랜",
    screens: [
      { id: "book-search", label: "책 검색" },
      { id: "book-detail", label: "책 상세/등록" },
      { id: "my-library", label: "내 서재" },
      { id: "reading-progress", label: "독서 진도 입력" },
      { id: "one-line-review", label: "한줄평" },
      { id: "sns-share", label: "SNS 공유" },
    ],
  },
  {
    id: "groups",
    label: "같이 책 읽기",
    screens: [
      { id: "group-list", label: "독서모임 목록" },
      { id: "create-group", label: "모임 개설" },
      { id: "join-group", label: "모임 참가" },
      { id: "group-home", label: "모임 홈" },
      { id: "invite", label: "멤버 초대" },
      { id: "progress-share", label: "진도 공유" },
      { id: "comments", label: "공유 책 댓글" },
      { id: "group-settings", label: "모임 설정" },
    ],
  },
];

function getScreen(id: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    "main-home": <MainHomeScreen />,
    "reading-progress": <ReadingProgressScreen />,
    login: <LoginScreen />,
    signup: <SignUpScreen />,
    mypage: <MyPageScreen />,
    "edit-profile": <EditProfileScreen />,
    "change-password": <ChangePasswordScreen />,
    "delete-account": <DeleteAccountScreen />,
    "book-search": <BookSearchScreen />,
    "book-detail": <BookDetailScreen />,
    "my-library": <MyLibraryScreen />,
    "one-line-review": <OneLineReviewScreen />,
    "sns-share": <SNSShareScreen />,
    "group-list": <GroupListScreen />,
    "create-group": <CreateGroupScreen />,
    "join-group": <JoinGroupScreen />,
    "group-home": <GroupHomeScreen />,
    invite: <InviteScreen />,
    "progress-share": <ProgressShareScreen />,
    comments: <CommentsScreen />,
    "group-settings": <GroupSettingsScreen />,
  };
  return map[id] ?? null;
}

// ────────────────────────────────────────────────────────────
// MAIN APP — DESIGN DOC VIEWER
// ────────────────────────────────────────────────────────────

export default function App() {
  const [selected, setSelected] = useState("main-home");
  const [overview, setOverview] = useState(false);

  const allScreens = CATEGORIES.flatMap((c) => c.screens);
  const currentCat = CATEGORIES.find((c) => c.screens.some((s) => s.id === selected));
  const currentLabel = allScreens.find((s) => s.id === selected)?.label;

  function select(id: string) {
    setSelected(id);
    setOverview(false);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#EDE7D8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-58 bg-[#1C1A16] text-[#FDFBF4] flex flex-col overflow-y-auto shrink-0" style={{ width: 232 }}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#8B5E3C] rounded-lg flex items-center justify-center shrink-0">
              <BookMarked size={13} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-sm tracking-widest text-[#FDFBF4]">READLOG</span>
          </div>
          <p className="text-[10px] text-white/25 mt-1 pl-9">화면설계서 v1.0</p>
        </div>

        <nav className="px-3 py-4 flex-1">
          <button
            onClick={() => setOverview(true)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium mb-3 transition-colors ${overview ? "bg-[#8B5E3C]/35 text-[#FDFBF4]" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
          >
            📋 전체 화면 보기
          </button>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="mb-4">
              <p className="text-[9px] text-white/25 font-semibold uppercase tracking-widest px-3 mb-1.5">{cat.label}</p>
              {cat.screens.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => select(id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selected === id && !overview ? "bg-[#2D4A3E] text-[#FDFBF4]" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-white/8 text-[9px] text-white/15 leading-relaxed">
          기준 디바이스: iPhone 15 (390×844)<br />
          Flexbox 반응형 레이아웃
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-8 py-4 border-b border-black/8 bg-[#F0E8D5]/90 flex items-center justify-between shrink-0">
          <div>
            {overview ? (
              <>
                <h1 className="font-serif text-lg text-[#1C1A16]">전체 화면 보기</h1>
                <p className="text-xs text-[#9E9E8A]">READLOG 화면설계서 · 총 {allScreens.length}개 화면</p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-lg text-[#1C1A16]">{currentLabel}</h1>
                <p className="text-xs text-[#9E9E8A]">{currentCat?.label}</p>
              </>
            )}
          </div>
          <div className="text-xs text-[#9E9E8A] font-mono bg-[#E0D8C4] px-2.5 py-1 rounded-lg">390 × 844</div>
        </div>

        {overview ? (
          /* ── Overview grid ── */
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="mb-10">
                <h2 className="font-serif text-base text-[#1C1A16] mb-4 pb-2 border-b border-black/10 flex items-center gap-2">
                  {cat.label}
                  <span className="text-xs text-[#9E9E8A] font-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>{cat.screens.length}개 화면</span>
                </h2>
                <div className="flex flex-wrap gap-5">
                  {cat.screens.map(({ id, label }) => (
                    <div key={id} className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => select(id)}
                        className="relative rounded-xl overflow-hidden border-2 border-black/8 hover:border-[#2D4A3E] transition-colors shadow-md group"
                        style={{ width: 117, height: 253 }}
                        title={label}
                      >
                        <div style={{ transform: "scale(0.3)", transformOrigin: "top left", width: 390, height: 844, pointerEvents: "none" }}>
                          {getScreen(id)}
                        </div>
                        <div className="absolute inset-0 bg-transparent group-hover:bg-[#2D4A3E]/8 transition-colors" />
                      </button>
                      <span className="text-[11px] text-[#7A7060] font-medium text-center leading-tight max-w-[110px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Single screen in device shell ── */
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="relative">
              {/* Phone shell */}
              <div className="absolute bg-[#18181B] rounded-[52px] shadow-2xl" style={{ inset: -12 }} />
              <div className="absolute border border-white/8 rounded-[56px]" style={{ inset: -14 }} />
              {/* Side buttons */}
              <div className="absolute bg-[#27272A] rounded-r-sm" style={{ left: -17, top: 120, width: 4, height: 32 }} />
              <div className="absolute bg-[#27272A] rounded-r-sm" style={{ left: -17, top: 168, width: 4, height: 56 }} />
              <div className="absolute bg-[#27272A] rounded-r-sm" style={{ left: -17, top: 236, width: 4, height: 56 }} />
              <div className="absolute bg-[#27272A] rounded-l-sm" style={{ right: -17, top: 172, width: 4, height: 72 }} />
              {/* Dynamic island */}
              <div className="absolute left-1/2 -translate-x-1/2 bg-[#18181B] rounded-full z-20" style={{ width: 120, height: 34, top: -6 }} />
              {/* Screen */}
              <div className="relative overflow-hidden rounded-[40px]" style={{ width: 390, height: 844 }}>
                {getScreen(selected)}
              </div>
              {/* Home indicator */}
              <div className="absolute left-1/2 -translate-x-1/2 bg-white/25 rounded-full" style={{ width: 100, height: 4, bottom: -9 }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
