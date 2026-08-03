import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function CameraSimulatorModal({ visible, onClose, onCapturePhoto }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <FontAwesome name="times" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Camera HD</Text>
          <TouchableOpacity style={styles.flashBtn}>
            <FontAwesome name="flash" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera Viewport Simulation */}
        <View style={styles.viewport}>
          <Text style={styles.viewfinderText}>📷 Direct Camera Viewfinder</Text>
          <Text style={styles.subText}>AI Auto-Focus & Scene Optimization Active</Text>
        </View>

        {/* Shutter Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.galleryBtn} onPress={onClose}>
            <FontAwesome name="image" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterBtn}
            onPress={() => {
              if (onCapturePhoto) onCapturePhoto('📷 [Captured Photo]');
              onClose();
            }}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipBtn}>
            <FontAwesome name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  flashBtn: {
    padding: 8,
  },
  viewport: {
    flex: 1,
    backgroundColor: '#111827',
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  viewfinderText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subText: {
    color: '#64748B',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
