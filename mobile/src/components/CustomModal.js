import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export default function CustomModal({ visible, onClose, title, message, type = 'success' }) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalInner}>
                    {/* Icon */}
                    <View style={styles.modalIconBg}>
                        <View style={type === 'error' ? styles.modalIconCircleError : styles.modalIconCircle}>
                            <Ionicons 
                                name={type === 'success' ? "checkmark" : "close"} 
                                size={24} 
                                color={theme.colors.white} 
                            />
                        </View>
                    </View>

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>

                    <TouchableOpacity 
                        style={type === 'error' ? styles.modalButtonError : styles.modalButton} 
                        onPress={onClose}
                    >
                        <Text style={styles.modalButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalInner: {
        backgroundColor: theme.colors.white,
        width: '100%',
        maxWidth: 280, // Smaller popup
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconBg: {
        backgroundColor: theme.colors.background, // Light gray
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIconCircle: {
        backgroundColor: '#10B981', // Success green
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalIconCircleError: {
        backgroundColor: '#F43F5E', // Error red
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F43F5E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textMain,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        color: theme.colors.textSub,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#0047FF', // Standard blue
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalButtonError: {
        backgroundColor: '#F43F5E', // Red for error
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
    },
    modalButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
