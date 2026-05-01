import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  draft: string;
  isStreaming: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function InputBar({ draft, isStreaming, onChangeText, onSend, onStop }: Props) {
  return (
    <View style={styles.inputBar}>
      <TextInput
        style={styles.textInput}
        value={draft}
        onChangeText={onChangeText}
        placeholder="Message…"
        placeholderTextColor="#999"
        multiline
        maxLength={4000}
        returnKeyType="default"
      />
      {isStreaming ? (
        <TouchableOpacity style={[styles.actionBtn, styles.stopBtn]} onPress={onStop}>
          <Text style={styles.stopIcon}>■</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, styles.sendBtn, !draft.trim() && styles.btnDisabled]}
          onPress={onSend}
          disabled={!draft.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginRight: 8,
    color: '#111',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    backgroundColor: '#1a73e8',
  },
  stopBtn: {
    backgroundColor: '#e53935',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stopIcon: {
    color: '#fff',
    fontSize: 14,
  },
});
