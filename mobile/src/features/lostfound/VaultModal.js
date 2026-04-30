import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function VaultModal({
    visible,
    onClose,
    vaultItems,
    newVaultTitle, setNewVaultTitle,
    newVaultImage,
    onPickImage,
    onAddItem,
    onDeleteItem,
}) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage Vault</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={theme.colors.textSub} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Add New Item Section */}
                        <Text style={styles.formSectionLabel}>ADD NEW ITEM TO VAULT</Text>
                        
                        <View style={styles.iconInputContainer}>
                            <Ionicons name="pricetag" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                            <TextInput 
                                style={styles.iconInput}
                                placeholder="Item Title (e.g. Red iPhone)"
                                placeholderTextColor="#A1A5CD"
                                value={newVaultTitle}
                                onChangeText={setNewVaultTitle}
                            />
                        </View>
                        
                        <TouchableOpacity style={styles.modalUploadContainer} onPress={onPickImage}>
                            {newVaultImage ? (
                                <Image source={{ uri: newVaultImage }} style={styles.modalUploadedImagePreview} />
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                                    <Text style={styles.modalUploadText}>Select Item Image</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.addItemBtn} onPress={onAddItem}>
                            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                            <Text style={styles.addItemBtnText}>Add Item</Text>
                        </TouchableOpacity>

                        <View style={styles.modalDivider} />

                        {/* Saved Items */}
                        <Text style={styles.formSectionLabel}>YOUR SAVED ITEMS</Text>
                        
                        {vaultItems.length === 0 ? (
                            <Text style={styles.emptyVaultText}>No items in vault yet.</Text>
                        ) : (
                            vaultItems.map((item) => (
                                <View key={item._id} style={styles.vaultListItem}>
                                    <Image source={{ uri: item.image }} style={styles.vaultListImage} />
                                    
                                    <View style={styles.vaultListContent}>
                                        <Text style={styles.vaultListTitle}>{item.title}</Text>
                                        <Text style={styles.vaultListSub}>{item.subtext}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.deleteBtn}
                                        onPress={() => onDeleteItem(item._id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        height: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E1B4B',
    },
    modalCloseBtn: {
        padding: 4,
    },
    formSectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    iconInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 20,
    },
    iconInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E1B4B',
        fontWeight: '600',
    },
    modalUploadContainer: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    modalUploadText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
        marginLeft: 8,
    },
    modalUploadedImagePreview: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    addItemBtn: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    addItemBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 6,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    emptyVaultText: {
        textAlign: 'center',
        color: theme.colors.textSub,
        fontStyle: 'italic',
        marginTop: 10,
    },
    vaultListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    vaultListImage: {
        width: 70,
        height: '100%',
        minHeight: 70,
        backgroundColor: '#EBECEF',
    },
    vaultListContent: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    vaultListTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E1B4B',
    },
    vaultListSub: {
        fontSize: 12,
        color: theme.colors.textSub,
        marginTop: 2,
    },
    deleteBtn: {
        padding: 12,
        marginRight: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
});
