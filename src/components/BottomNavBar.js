import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { id: 'home',    label: 'Home',     icon: 'home' },
  { id: 'chats',   label: 'Chats',    icon: 'comment' },
  { id: 'matches', label: 'Matches',  icon: 'users' },
  { id: 'profile', label: 'Settings', icon: 'cog' },
];

export default function BottomNavBar({ activeTab, onSelectTab, onTabChange, theme }) {
  const insets = useSafeAreaInsets();
  const handlePress = onSelectTab || onTabChange || (() => {});
  const user = authService.getCurrentUser();
  const isDark =
    theme?.mode === 'dark' ||
    theme?.bg === '#111111' ||
    theme?.bg === '#121212' ||
    user?.darkMode === true;

  const activeIndex = Math.max(0, TABS.findIndex(t => t.id === activeTab));

  // ── Layout measurement ──
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? barWidth / TABS.length : 0;

  // ── Sliding pill spring animation ──
  const slideX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth <= 0) return;
    Animated.spring(slideX, {
      toValue: activeIndex * tabWidth,
      damping: 18,
      stiffness: 170,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth]);

  // ── Blur Tint selection ──
  const blurTint = Platform.OS === 'ios'
    ? (isDark ? 'systemThinMaterialDark' : 'systemThinMaterial')
    : (isDark ? 'dark' : 'light');

  // ── Dynamic Colors ──
  const dockBg      = isDark ? 'rgba(20, 20, 20, 0.75)' : 'rgba(255, 255, 255, 0.75)';
  const dockBorder  = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)';
  const pillBg      = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.05)';
  const pillBorder  = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)';
  const activeColor = isDark ? '#FFFFFF' : '#1c1b1f';
  const mutedColor  = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(60, 60, 67, 0.60)';

  const bottomPosition = insets.bottom > 0 ? insets.bottom : 16;

  return (
    <View style={[styles.wrapper, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View style={[styles.shadow, isDark && styles.shadowDark]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 90}
          tint={blurTint}
          style={[
            styles.dock,
            { backgroundColor: dockBg, borderColor: dockBorder },
          ]}
        >
          {/* Tabs container */}
          <View
            style={styles.tabsRow}
            onLayout={e => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && w !== barWidth) setBarWidth(w);
            }}
          >
            {/* ── Sliding active tab pill indicator ── */}
            {tabWidth > 0 && (
              <Animated.View
                style={[
                  styles.pill,
                  {
                    width: tabWidth - 10,
                    backgroundColor: pillBg,
                    borderColor: pillBorder,
                    transform: [{ translateX: Animated.add(slideX, 5) }],
                  },
                ]}
              />
            )}

            {/* ── Tab Items ── */}
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabBtn}
                  onPress={() => handlePress(tab.id)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={tab.icon}
                    size={20}
                    color={isActive ? activeColor : mutedColor}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? activeColor : mutedColor,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  shadow: {
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  shadowDark: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  dock: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
});
