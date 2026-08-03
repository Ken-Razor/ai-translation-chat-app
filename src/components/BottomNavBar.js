import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

let BlurView = null;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  BlurView = null;
}

export default function BottomNavBar({ activeTab, onSelectTab, theme }) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: 'comments' },
    { id: 'contacts', label: 'Contacts', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'cog' },
  ];

  const isIOS = Platform.OS === 'ios';

  const renderTabButtons = () => (
    tabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.iosTabBtn,
            isActive && [
              styles.iosActiveTabPill,
              {
                backgroundColor: theme.mode === 'dark'
                  ? 'rgba(99, 102, 241, 0.28)'
                  : 'rgba(99, 102, 241, 0.15)',
                borderColor: theme.primary,
              }
            ]
          ]}
          onPress={() => onSelectTab(tab.id)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={tab.icon}
            size={18}
            color={isActive ? theme.primary : theme.subtext}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: isActive ? theme.primary : theme.subtext },
              isActive && styles.tabLabelActive
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })
  );

  // --- iOS Liquid Glass Navigation Bar ---
  if (isIOS) {
    if (BlurView) {
      return (
        <View style={styles.iosFloatingWrapper}>
          <BlurView
            intensity={85}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={[
              styles.iosGlassContainer,
              {
                borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)',
                backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              }
            ]}
          >
            {renderTabButtons()}
          </BlurView>
        </View>
      );
    }

    // Pure React Native Liquid Glass Fallback (Works even without expo-blur)
    return (
      <View style={styles.iosFloatingWrapper}>
        <View
          style={[
            styles.iosGlassContainer,
            {
              borderColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)',
              backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            }
          ]}
        >
          {renderTabButtons()}
        </View>
      </View>
    );
  }

  // --- Android Standard Material Bottom Navigation Bar ---
  return (
    <View style={[styles.androidNavContainer, { backgroundColor: theme.headerBg, borderTopColor: theme.border }]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.androidTabBtn}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.androidIconPill, isActive && { backgroundColor: theme.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)' }]}>
              <FontAwesome
                name={tab.icon}
                size={20}
                color={isActive ? theme.primary : theme.subtext}
              />
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? theme.primary : theme.subtext }, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // iOS Floating Liquid Glass Styles
  iosFloatingWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  iosGlassContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  iosTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 22,
    gap: 6,
  },
  iosActiveTabPill: {
    borderWidth: 1,
  },

  // Android Material Standard Styles
  androidNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    elevation: 8,
  },
  androidTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  androidIconPill: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 2,
  },

  // Common Typography
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
