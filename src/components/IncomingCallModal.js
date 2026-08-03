import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DARK_THEME } from '../theme/colors';

import { unlockAudioContext } from '../services/audioStreamService';

export default function IncomingCallModal({
  visible,
  callData,
  onAccept,
  onDecline,
  theme = DARK_THEME
}) {
  if (!visible || !callData) return null;

  const isDark = theme.mode === 'dark';
  const isVideo = callData.callType === 'video';
  const callerInitial = callData.callerName ? callData.callerName.charAt(0).toUpperCase() : 'C';

  const handleAcceptPress = () => {
    unlockAudioContext();
    if (onAccept) onAccept();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlayContainer}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.border }]}>
          {/* Pulsating Call Icon Header */}
          <View style={styles.pulseContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: isVideo ? '#8B5CF6' : '#2563EB' }]}>
              <Text style={styles.avatarText}>{callerInitial}</Text>
            </View>
          </View>

          {/* Incoming Call Details */}
          <Text style={styles.incomingLabel}>
            {isVideo ? '📹 INCOMING VIDEO CALL' : '📞 INCOMING VOICE CALL'}
          </Text>
          <Text style={[styles.callerName, { color: theme.text }]}>{callData.callerName || callData.callerEmail}</Text>
          <Text style={[styles.callerEmail, { color: theme.subtext }]}>{callData.callerEmail}</Text>
          <Text style={styles.ringingSubText}>Ringing... BridgeTalk AI P2P Call</Text>

          {/* Action Buttons: Green Accept vs Red Decline */}
          <View style={styles.buttonRow}>
            {/* Red Decline Button */}
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline}>
              <FontAwesome name="phone" size={24} color="#FFFFFF" style={styles.declineIcon} />
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>

            {/* Green Accept Button */}
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAcceptPress}>
              <FontAwesome name="phone" size={24} color="#FFFFFF" />
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
  },
  pulseContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  incomingLabel: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
  },
  callerEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  ringingSubText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 120,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
