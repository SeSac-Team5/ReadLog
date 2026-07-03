import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Share, { Social } from "react-native-share";
import { captureRef } from "react-native-view-shot";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { addStickers, createSnsPost } from "../../api/reading-plan/sns";
import type { UserLibraryItem } from "../../types/reading-plan/book";
import type {
  CommentStickerBackground,
  Sticker,
  StickerType,
} from "../../types/reading-plan/sns";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  textSubtle: "#7A7060",
  border: "rgba(0, 0, 0, 0.08)",
};

const EMOJI_OPTIONS = ["📚", "✨", "🌿", "☕", "🎭", "💫", "📖", "🌸", "🦋", "🍃"];

const OVERLAY_TYPES: { key: Extract<StickerType, `progress_${string}`>; label: string }[] = [
  { key: "progress_ring", label: "원형 게이지" },
  { key: "progress_bar", label: "진행 바" },
  { key: "progress_badge", label: "텍스트 뱃지" },
];

const COMMENT_BACKGROUND_OPTIONS: {
  key: CommentStickerBackground;
  label: string;
  swatch: string;
}[] = [
  { key: "white", label: "화이트", swatch: "rgba(255, 255, 255, 0.9)" },
  { key: "gray", label: "그레이", swatch: "rgba(200, 197, 190, 0.9)" },
  { key: "transparent", label: "투명", swatch: "transparent" },
  { key: "dark", label: "다크", swatch: "rgba(0, 0, 0, 0.6)" },
];

function commentBackgroundStyle(background?: CommentStickerBackground | null) {
  const option = COMMENT_BACKGROUND_OPTIONS.find((item) => item.key === background);
  return option?.swatch ?? COMMENT_BACKGROUND_OPTIONS[0].swatch;
}

function commentTextColor(background?: CommentStickerBackground | null) {
  return background === "dark" ? "#FFFFFF" : COLORS.textPrimary;
}

const INSTAGRAM_APP_ID = process.env.EXPO_PUBLIC_INSTAGRAM_APP_ID ?? "";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const isProgressType = (type: StickerType) => type.startsWith("progress_");

function getTouchDistance(touches: readonly { pageX: number; pageY: number }[]) {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function getTouchAngle(touches: readonly { pageX: number; pageY: number }[]) {
  const [a, b] = touches;
  return (Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX) * 180) / Math.PI;
}

let stickerIdCounter = 0;
function createStickerId(prefix: string) {
  stickerIdCounter += 1;
  return `${prefix}-${stickerIdCounter}`;
}

function stickerChipLabel(sticker: Sticker) {
  if (sticker.type === "emoji") return sticker.emoji ?? "🙂";
  if (sticker.type === "comment") return "💬";
  if (sticker.type === "book_cover") return "📕";
  return "진도";
}

interface SNSShareScreenProps {
  libraryItem: UserLibraryItem;
  onBack: () => void;
  onShared?: () => void;
}

export function SNSShareScreen({ libraryItem, onBack, onShared }: SNSShareScreenProps) {
  const previewRef = useRef<View>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [overlayOn, setOverlayOn] = useState(false);
  const [overlayType, setOverlayType] = useState<Extract<StickerType, `progress_${string}`>>(
    "progress_badge"
  );
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBackground, setCommentBackground] = useState<CommentStickerBackground>("white");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = libraryItem.book.pageCount ?? 0;
  const percent = totalPages
    ? Math.min(100, Math.round((libraryItem.currentPage / totalPages) * 100))
    : 0;

  useEffect(() => {
    setStickers((prev) => {
      const withoutOverlay = prev.filter((sticker) => !isProgressType(sticker.type));
      if (!overlayOn) return withoutOverlay;
      const existing = prev.find((sticker) => isProgressType(sticker.type));
      const base: Sticker = existing ?? {
        id: createStickerId("overlay"),
        type: overlayType,
        emoji: null,
        content: null,
        x: 0.68,
        y: 0.72,
        scale: 1,
        rotation: 0,
        visible: true,
      };
      return [...withoutOverlay, { ...base, type: overlayType }];
    });
  }, [overlayOn, overlayType]);

  const selectedSticker = useMemo(
    () => stickers.find((sticker) => sticker.id === selectedStickerId) ?? null,
    [stickers, selectedStickerId]
  );

  const updateSticker = (id: string, patch: Partial<Sticker>) => {
    setStickers((prev) => prev.map((sticker) => (sticker.id === id ? { ...sticker, ...patch } : sticker)));
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
    setSelectedStickerId((current) => (current === id ? null : current));
    setOverlayOn((current) => {
      const removed = stickers.find((sticker) => sticker.id === id);
      return removed && isProgressType(removed.type) ? false : current;
    });
  };

  const addEmojiSticker = (emoji: string) => {
    const sticker: Sticker = {
      id: createStickerId("emoji"),
      type: "emoji",
      emoji,
      content: null,
      x: 0.42,
      y: 0.38,
      scale: 1,
      rotation: 0,
      visible: true,
    };
    setStickers((prev) => [...prev, sticker]);
    setSelectedStickerId(sticker.id);
  };

  const handleAddCommentSticker = () => {
    const text = commentDraft.trim();
    if (!text) return;
    const sticker: Sticker = {
      id: createStickerId("comment"),
      type: "comment",
      emoji: null,
      content: text,
      backgroundColor: commentBackground,
      x: 0.24,
      y: 0.55,
      scale: 1,
      rotation: 0,
      visible: true,
    };
    setStickers((prev) => [...prev, sticker]);
    setSelectedStickerId(sticker.id);
    setCommentDraft("");
    setIsAddingComment(false);
  };

  const addBookCoverSticker = () => {
    const sticker: Sticker = {
      id: createStickerId("cover"),
      type: "book_cover",
      emoji: null,
      content: null,
      x: 0.5,
      y: 0.12,
      scale: 1,
      rotation: 0,
      visible: true,
    };
    setStickers((prev) => [...prev, sticker]);
    setSelectedStickerId(sticker.id);
  };

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("사진 접근 권한이 필요해요");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("카메라 접근 권한이 필요해요");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert("사진 추가", "어떻게 추가할까요?", [
      { text: "사진 촬영", onPress: handleTakePhoto },
      { text: "앨범에서 선택", onPress: handlePickFromLibrary },
      { text: "취소", style: "cancel" },
    ]);
  };

  const waitForNextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setError(null);
    const previouslySelectedId = selectedStickerId;
    try {
      // Deselecting first drops the dashed selection border before we capture —
      // otherwise it gets baked into the shared image. Wait a couple of frames so
      // the re-render without the border actually paints before captureRef runs.
      setSelectedStickerId(null);
      await waitForNextFrame();

      const dataUri = await captureRef(previewRef, {
        format: "jpg",
        quality: 0.7,
        result: "data-uri",
      });
      const shareFileUri = await captureRef(previewRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });

      const post = await createSnsPost({
        bookId: libraryItem.book.id,
        imageUrl: dataUri,
      });

      const visibleStickers = stickers.filter((sticker) => sticker.visible);
      if (visibleStickers.length > 0) {
        await addStickers(
          post.id,
          visibleStickers.map(({ id, ...rest }) => rest)
        );
      }

      if (INSTAGRAM_APP_ID) {
        await Share.shareSingle({
          social: Social.InstagramStories,
          backgroundImage: shareFileUri,
          appId: INSTAGRAM_APP_ID,
        });
      } else {
        // No Facebook App ID configured yet — fall back to the generic share
        // sheet (still lets the user pick Instagram manually) so this flow
        // isn't blocked on Meta developer app approval during local testing.
        await Share.open({
          url: shareFileUri,
          type: "image/jpeg",
          failOnCancel: false,
        });
      }

      onShared?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "공유에 실패했어요");
    } finally {
      setSelectedStickerId(previouslySelectedId);
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SNS 공유</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        scrollEnabled={!isDraggingSticker}
      >
        <View
          ref={previewRef}
          collapsable={false}
          style={styles.previewCard}
          onLayout={(event) =>
            setContainerSize({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
          }
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderTitle}>{libraryItem.book.title}</Text>
              <Text style={styles.previewPlaceholderAuthor}>{libraryItem.book.author}</Text>
            </View>
          )}

          {stickers
            .filter((sticker) => sticker.visible)
            .map((sticker) => (
              <DraggableSticker
                key={sticker.id}
                sticker={sticker}
                containerSize={containerSize}
                isSelected={selectedStickerId === sticker.id}
                onSelect={() => setSelectedStickerId(sticker.id)}
                onChange={(patch) => updateSticker(sticker.id, patch)}
                onDragStart={() => setIsDraggingSticker(true)}
                onDragEnd={() => setIsDraggingSticker(false)}
              >
                <StickerContent sticker={sticker} libraryItem={libraryItem} percent={percent} totalPages={totalPages} />
              </DraggableSticker>
            ))}
        </View>

        {stickers.length > 0 ? (
          <View style={styles.stickerManagerRow}>
            {stickers.map((sticker) => (
              <TouchableOpacity
                key={sticker.id}
                style={[
                  styles.stickerChip,
                  selectedStickerId === sticker.id && styles.stickerChipActive,
                  !sticker.visible && styles.stickerChipHidden,
                ]}
                onPress={() => setSelectedStickerId(sticker.id)}
              >
                <Text style={styles.stickerChipText}>{stickerChipLabel(sticker)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {selectedSticker ? (
          <View style={styles.stickerToolbar}>
            <Text style={styles.stickerToolbarHint}>
              스티커 위에서 두 손가락으로 오므리거나 돌려도, 아래 버튼으로 세밀하게 조정해도 돼요
            </Text>
            <View style={styles.stickerToolbarButtons}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() =>
                  updateSticker(selectedSticker.id, { scale: Math.min(3, selectedSticker.scale + 0.15) })
                }
              >
                <Text style={styles.toolbarButtonText}>확대</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() =>
                  updateSticker(selectedSticker.id, { scale: Math.max(0.5, selectedSticker.scale - 0.15) })
                }
              >
                <Text style={styles.toolbarButtonText}>축소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() =>
                  updateSticker(selectedSticker.id, { rotation: (selectedSticker.rotation + 15) % 360 })
                }
              >
                <Text style={styles.toolbarButtonText}>회전</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={() => updateSticker(selectedSticker.id, { visible: !selectedSticker.visible })}
              >
                <Text style={styles.toolbarButtonText}>
                  {selectedSticker.visible ? "숨기기" : "보이기"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, styles.toolbarButtonDanger]}
                onPress={() => removeSticker(selectedSticker.id)}
              >
                <Text style={[styles.toolbarButtonText, styles.toolbarButtonDangerText]}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View>
          <Text style={styles.sectionLabel}>이모지 스티커 추가</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => addEmojiSticker(emoji)}
                >
                  <Text style={styles.emojiButtonText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {libraryItem.book.coverUrl ? (
          <TouchableOpacity style={styles.dashedButton} onPress={addBookCoverSticker}>
            <Text style={styles.dashedButtonText}>+ 책 표지 스티커</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.overlayBox}>
          <View style={styles.overlayHeaderRow}>
            <View style={styles.overlayHeaderText}>
              <Text style={styles.overlayTitle}>진도 시각화 오버레이</Text>
              <Text style={styles.overlaySubtitle}>저장된 독서 진도를 카드에 표시</Text>
            </View>
            <Switch
              value={overlayOn}
              onValueChange={setOverlayOn}
              trackColor={{ false: COLORS.beigeDark, true: COLORS.deepGreen }}
            />
          </View>
          {overlayOn ? (
            <>
              <View style={styles.overlayTypeRow}>
                {OVERLAY_TYPES.map((option) => {
                  const active = overlayType === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.overlayTypeButton, active && styles.overlayTypeButtonActive]}
                      onPress={() => setOverlayType(option.key)}
                    >
                      <Text
                        style={[styles.overlayTypeText, active && styles.overlayTypeTextActive]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.helperText}>미리보기 위에서 드래그해 위치를 조정할 수 있어요.</Text>
            </>
          ) : null}
        </View>

        <View style={styles.commentStickerBox}>
          <Text style={styles.sectionLabel}>코멘트 스티커 추가</Text>
          <Text style={styles.helperText}>사진 위 자유 위치에 배치되는 텍스트예요</Text>
          {isAddingComment ? (
            <>
              <View style={styles.commentDraftRow}>
                <TextInput
                  style={styles.commentDraftInput}
                  placeholder="스티커에 표시할 문구"
                  placeholderTextColor={COLORS.textMuted}
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  maxLength={40}
                />
                <TouchableOpacity style={styles.smallPrimaryButton} onPress={handleAddCommentSticker}>
                  <Text style={styles.smallPrimaryButtonText}>추가</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.backgroundSwatchRow}>
                {COMMENT_BACKGROUND_OPTIONS.map((option) => {
                  const active = commentBackground === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.backgroundSwatch,
                        { backgroundColor: option.swatch },
                        active && styles.backgroundSwatchActive,
                      ]}
                      onPress={() => setCommentBackground(option.key)}
                    >
                      {active ? <Text style={styles.backgroundSwatchCheck}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.dashedButton} onPress={() => setIsAddingComment(true)}>
              <Text style={styles.dashedButtonText}>+ 코멘트 스티커</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.dashedButton} onPress={handlePickPhoto}>
          <Text style={styles.dashedButtonText}>{photoUri ? "사진 변경" : "내 사진 업로드"}</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isSharing}>
          {isSharing ? (
            <ActivityIndicator color={COLORS.beigeLight} />
          ) : (
            <Text style={styles.shareButtonText}>Instagram에 공유하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DraggableSticker({
  sticker,
  containerSize,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  children,
}: {
  sticker: Sticker;
  containerSize: { width: number; height: number };
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Sticker>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  const startPos = useRef({ x: sticker.x, y: sticker.y });

  // Two-finger pinch-to-scale + rotate state. `pinchStart` snapshots the touch
  // distance/angle and the sticker's scale/rotation at the moment a second finger
  // touches down, so scale/rotation deltas are computed relative to that moment
  // rather than accumulating error frame to frame.
  const pinchStartRef = useRef<{
    distance: number;
    angle: number;
    scale: number;
    rotation: number;
  } | null>(null);
  const lastTouchCountRef = useRef(1);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

  // PanResponder.create(...) only runs once (captured in the useRef initializer), so
  // any value it closes over is frozen at mount time. Reading position off this ref
  // (kept fresh every render) instead of the `sticker` prop directly is what lets a
  // second drag start from where the sticker actually is instead of snapping back to
  // its position from the very first render.
  const stickerRef = useRef(sticker);
  useEffect(() => {
    stickerRef.current = sticker;
  }, [sticker]);

  const containerSizeRef = useRef(containerSize);
  useEffect(() => {
    containerSizeRef.current = containerSize;
  }, [containerSize]);

  // (x, y) is the sticker's CENTER, not its top-left corner — scaling then grows/shrinks
  // it around a fixed point instead of dragging one corner further off-screen. contentSize
  // is the sticker's already-scaled rendered size (scale is baked into fontSize/width in
  // StickerContent rather than applied as a transform — see there for why), measured via
  // onLayout below, so this naturally re-clamps whenever scale changes and the content's
  // real layout size changes with it.
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const contentSizeRef = useRef(contentSize);
  useEffect(() => {
    contentSizeRef.current = contentSize;
  }, [contentSize]);

  const clampCenter = (x: number, y: number) => {
    const container = containerSizeRef.current;
    if (!container.width || !container.height) {
      return { x: clamp01(x), y: clamp01(y) };
    }
    const halfWidthFraction = contentSizeRef.current.width / container.width / 2;
    const halfHeightFraction = contentSizeRef.current.height / container.height / 2;
    const minX = Math.min(0.5, halfWidthFraction);
    const maxX = Math.max(0.5, 1 - halfWidthFraction);
    const minY = Math.min(0.5, halfHeightFraction);
    const maxY = Math.max(0.5, 1 - halfHeightFraction);
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };

  // Re-clamp whenever the measured content size or container size changes (e.g. tapping
  // "확대" near an edge) so the sticker can't balloon outside the photo.
  useEffect(() => {
    const clamped = clampCenter(sticker.x, sticker.y);
    if (clamped.x !== sticker.x || clamped.y !== sticker.y) {
      onChange(clamped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentSize.width, contentSize.height, containerSize.width, containerSize.height]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        onSelect();
        onDragStart();
        startPos.current = { x: stickerRef.current.x, y: stickerRef.current.y };
        dragOffsetRef.current = { dx: 0, dy: 0 };
        const touches = event.nativeEvent.touches;
        lastTouchCountRef.current = touches.length;
        pinchStartRef.current =
          touches.length >= 2
            ? {
                distance: getTouchDistance(touches),
                angle: getTouchAngle(touches),
                scale: stickerRef.current.scale,
                rotation: stickerRef.current.rotation,
              }
            : null;
      },
      onPanResponderMove: (event, gesture) => {
        const touches = event.nativeEvent.touches;

        if (touches.length >= 2) {
          // (Re)anchor the pinch reference the instant a second finger lands, whether
          // that's on the very first move event or mid-gesture after starting with one.
          if (!pinchStartRef.current) {
            pinchStartRef.current = {
              distance: getTouchDistance(touches),
              angle: getTouchAngle(touches),
              scale: stickerRef.current.scale,
              rotation: stickerRef.current.rotation,
            };
          }
          lastTouchCountRef.current = touches.length;
          const { distance, angle, scale, rotation } = pinchStartRef.current;
          const nextScale = Math.min(3, Math.max(0.5, scale * (getTouchDistance(touches) / distance)));
          const nextRotation = (rotation + (getTouchAngle(touches) - angle) + 360) % 360;
          onChange({ scale: nextScale, rotation: nextRotation });
          return;
        }

        // Dropped back to one finger (or none) — if we were just pinching, reset the
        // drag baseline to the sticker's current position so translation doesn't jump
        // by however far the fingers moved while pinching.
        if (lastTouchCountRef.current >= 2) {
          startPos.current = { x: stickerRef.current.x, y: stickerRef.current.y };
          dragOffsetRef.current = { dx: gesture.dx, dy: gesture.dy };
          pinchStartRef.current = null;
        }
        lastTouchCountRef.current = touches.length;

        const container = containerSizeRef.current;
        if (!container.width || !container.height) return;
        onChange(
          clampCenter(
            startPos.current.x + (gesture.dx - dragOffsetRef.current.dx) / container.width,
            startPos.current.y + (gesture.dy - dragOffsetRef.current.dy) / container.height
          )
        );
      },
      onPanResponderRelease: onDragEnd,
      onPanResponderTerminate: onDragEnd,
    })
  ).current;

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setContentSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
      }}
      style={[
        styles.stickerWrapper,
        {
          left: sticker.x * containerSize.width - contentSize.width / 2,
          top: sticker.y * containerSize.height - contentSize.height / 2,
          transform: [{ rotate: `${sticker.rotation}deg` }],
        },
        isSelected && styles.stickerWrapperSelected,
      ]}
    >
      {children}
    </View>
  );
}

function StickerContent({
  sticker,
  libraryItem,
  percent,
  totalPages,
}: {
  sticker: Sticker;
  libraryItem: UserLibraryItem;
  percent: number;
  totalPages: number;
}) {
  // `scale` is baked directly into each case's dimensions (fontSize/width/etc.) rather
  // than applied as a transform on the wrapper — transform-scale stretches an
  // already-rasterized layer and goes blurry, while re-rendering at the target size
  // stays crisp (this matters most for the Image and SVG cases).
  const scale = sticker.scale;

  switch (sticker.type) {
    case "emoji":
      return <Text style={[styles.stickerEmoji, { fontSize: 28 * scale }]}>{sticker.emoji}</Text>;
    case "comment":
      return (
        <View
          style={[
            styles.commentBubble,
            {
              backgroundColor: commentBackgroundStyle(sticker.backgroundColor),
              maxWidth: 160 * scale,
              borderRadius: 10 * scale,
              paddingHorizontal: 10 * scale,
              paddingVertical: 6 * scale,
            },
          ]}
        >
          <Text
            style={[
              styles.commentBubbleText,
              { color: commentTextColor(sticker.backgroundColor), fontSize: 12 * scale },
            ]}
          >
            {sticker.content}
          </Text>
        </View>
      );
    case "book_cover":
      return libraryItem.book.coverUrl ? (
        <Image
          source={{ uri: libraryItem.book.coverUrl }}
          style={[styles.bookCoverSticker, { width: 64 * scale, borderRadius: 8 * scale }]}
          resizeMode="cover"
        />
      ) : null;
    case "progress_ring": {
      const size = 52 * scale;
      const strokeWidth = 4 * scale;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;
      const progressLength = (percent / 100) * circumference;
      return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={radius + strokeWidth / 2} fill="rgba(0, 0, 0, 0.45)" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={strokeWidth}
            strokeDasharray={`${progressLength} ${circumference}`}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
          <SvgText
            x={size / 2}
            y={size / 2 + 4 * scale}
            fontSize={11 * scale}
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            {`${percent}%`}
          </SvgText>
        </Svg>
      );
    }
    case "progress_bar":
      return (
        <View
          style={[
            styles.barOverlay,
            {
              width: 96 * scale,
              borderRadius: 10 * scale,
              paddingHorizontal: 10 * scale,
              paddingVertical: 6 * scale,
            },
          ]}
        >
          <Text
            style={[styles.barOverlayLabel, { fontSize: 9 * scale, marginBottom: 4 * scale }]}
            numberOfLines={1}
          >
            {libraryItem.book.title}
          </Text>
          <View style={[styles.barTrack, { height: 5 * scale }]}>
            <View style={[styles.barFill, { width: `${percent}%` }]} />
          </View>
          <Text style={[styles.barOverlayValue, { fontSize: 9 * scale, marginTop: 2 * scale }]}>
            {percent}%
          </Text>
        </View>
      );
    case "progress_badge":
    default:
      return (
        <View
          style={[
            styles.badgeOverlay,
            { borderRadius: 10 * scale, paddingHorizontal: 10 * scale, paddingVertical: 6 * scale },
          ]}
        >
          <Text style={[styles.badgeOverlayText, { fontSize: 10 * scale }]}>
            {libraryItem.status === "COMPLETED"
              ? "완독"
              : `p.${libraryItem.currentPage}/${totalPages || "?"}`}
          </Text>
          <Text style={[styles.badgeOverlaySubtext, { fontSize: 8 * scale }]} numberOfLines={1}>
            {libraryItem.book.title}
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.beigeLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
    width: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  previewCard: {
    aspectRatio: 1,
    // No borderRadius/overflow:hidden here — JPEG has no alpha channel, so the
    // corners clipped by a rounded rect would flatten to solid black once captured.
    backgroundColor: "#E8DFC8",
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  previewPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  previewPlaceholderAuthor: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  stickerWrapper: {
    position: "absolute",
  },
  stickerWrapperSelected: {
    borderWidth: 1,
    borderColor: COLORS.deepGreen,
    borderStyle: "dashed",
    borderRadius: 8,
  },
  stickerEmoji: {
    fontSize: 28,
  },
  commentBubble: {
    maxWidth: 160,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentBubbleText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  bookCoverSticker: {
    width: 64,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  barOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 96,
  },
  barOverlayLabel: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  barTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  barOverlayValue: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 2,
  },
  badgeOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  badgeOverlayText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  badgeOverlaySubtext: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.6)",
  },
  stickerManagerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  stickerChip: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.beigeDark,
    alignItems: "center",
    justifyContent: "center",
  },
  stickerChipActive: {
    borderWidth: 1.5,
    borderColor: COLORS.deepGreen,
  },
  stickerChipHidden: {
    opacity: 0.4,
  },
  stickerChipText: {
    fontSize: 14,
  },
  stickerToolbar: {
    gap: 8,
  },
  stickerToolbarHint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  stickerToolbarButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.beigeDark,
  },
  toolbarButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  toolbarButtonDanger: {
    backgroundColor: "rgba(185, 28, 28, 0.1)",
  },
  toolbarButtonDangerText: {
    color: "#B91C1C",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSubtle,
    marginBottom: 8,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.beigeDark,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiButtonText: {
    fontSize: 18,
  },
  overlayBox: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  overlayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlayHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  overlaySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  overlayTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  overlayTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD7CB",
    alignItems: "center",
  },
  overlayTypeButtonActive: {
    backgroundColor: COLORS.deepGreen,
    borderColor: COLORS.deepGreen,
  },
  overlayTypeText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  overlayTypeTextActive: {
    color: COLORS.beigeLight,
  },
  helperText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  commentStickerBox: {
    gap: 8,
  },
  commentDraftRow: {
    flexDirection: "row",
    gap: 8,
  },
  commentDraftInput: {
    flex: 1,
    backgroundColor: COLORS.beigeDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  backgroundSwatchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  backgroundSwatch: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DDD7CB",
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundSwatchActive: {
    borderWidth: 2,
    borderColor: COLORS.deepGreen,
  },
  backgroundSwatchCheck: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.deepGreen,
  },
  smallPrimaryButton: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  smallPrimaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
  dashedButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDD7CB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dashedButtonText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
  },
  shareButton: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
});
