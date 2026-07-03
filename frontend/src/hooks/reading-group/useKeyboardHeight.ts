import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/**
 * Android 한정으로 키보드가 윈도우를 실제 침범한 높이를 반환한다.
 *
 * endCoordinates.height 대신 (windowHeight - screenY) 를 사용하는 이유:
 * - endCoordinates.height는 nav bar 높이까지 포함해 과보정 발생
 * - windowHeight는 nav bar를 제외하므로 차이값이 실제 침범 높이와 정확히 일치
 * - adjustResize가 이미 윈도우를 줄인 경우 자동으로 0이 되어 이중 보정 방지
 *
 * iOS는 KeyboardAvoidingView behavior="padding" 을 그대로 사용하므로 항상 0 반환.
 */
export function useKeyboardHeight(): number {
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', e => {
      const windowH = Dimensions.get('window').height;
      const screenH = Dimensions.get('screen').height;
      // screen - window 차이가 키보드 높이의 85% 이상이면
      // adjustResize가 이미 윈도우를 줄인 것 → 이중 보정 방지
      const alreadyAdjusted = (screenH - windowH) >= e.endCoordinates.height * 0.85;
      setKbHeight(alreadyAdjusted ? 0 : Math.max(0, e.endCoordinates.height));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return kbHeight;
}
