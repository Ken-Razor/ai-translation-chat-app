import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function MediaPickerModal({
  visible,
  onClose,
  onLaunchCamera,
  onPickLibrary,
  onPickDocument
}) {
  if (!visible) return null;

  const handlePressOption = (actionFn) => {
    onClose();
    // 400ms timeout ensures Modal is fully unmounted from iOS view tree before launching native pickers
    setTimeout(() => {
      if (actionFn) actionFn();
    }, 400);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet Content Card */}
        <View style={styles.sheetCard}>
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>Share Content & Media</Text>

          {/* Option 1: Live Native Camera (Same trigger as right Camera button) */}
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => handlePressOption(onLaunchCamera)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#3B82F6' }]}>
              <FontAwesome name="camera" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextBox}>
              <Text style={styles.optionTitle}>Camera & Photos</Text>
              <Text style={styles.optionSub}>Take a live photo using device camera</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Photo & Video Library */}
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => handlePressOption(onPickLibrary)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#8B5CF6' }]}>
              <FontAwesome name="image" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextBox}>
              <Text style={styles.optionTitle}>Photo & Video Library</Text>
              <Text style={styles.optionSub}>Choose photos or videos from gallery</Text>
            </View>
          </TouchableOpacity>

          {/* Option 3: Document Attachment */}
          <TouchableOpacity
            style={styles.optionRow}
            activeOpacity={0.7}
            onPress={() => handlePressOption(onPickDocument)}
          >
            <View style={[styles.iconBox, { backgroundColor: '#10B981' }]}>
              <FontAwesome name="file-text" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextBox}>
              <Text style={styles.optionTitle}>Document</Text>
              <Text style={styles.optionSub}>Choose any PDF, Word, or text file from device storage</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, styles.cancelRow]}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
  },
  sheetCard: {
    backgroundColor: '#131C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#233048',
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  cancelRow: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
