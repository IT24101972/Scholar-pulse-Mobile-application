import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function ReportForm({
    isEditing,
    formType, setFormType,
    formTitle, setFormTitle,
    formLocation, setFormLocation,
    formDesc, setFormDesc,
    formPhone, setFormPhone,
    formImage,
    isLoading,
    vaultItems,
    onPickImage,
    onSelectFromVault,
    onOpenVault,
    onPublish,
    onClose,
}) {
    return (
        <ScrollView 
            style={styles.formContainer} 
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* Form Top Bar */}
            <View style={styles.formTopBar}>
                <TouchableOpacity onPress={onClose}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.formTopTitle}>{isEditing ? 'Update Report' : 'Report Lost Item'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Form Header */}
            <View style={styles.formHeaderRow}>
                <Text style={styles.formMainTitle}>{isEditing ? 'Edit Details' : 'Discovery Details'}</Text>
                <Text style={styles.formStepText}>{isEditing ? 'EDITING' : 'STEP 01'}</Text>
            </View>

            {/* Form Type Toggle */}
            <View style={styles.formToggleContainer}>
                <TouchableOpacity 
                    style={[styles.formToggleBtn, formType === 'lost' && styles.formToggleBtnActiveBlue]}
                    onPress={() => setFormType('lost')}
                >
                    <Ionicons name="search-outline" size={18} color={formType === 'lost' ? '#FFF' : theme.colors.textSub} />
                    <Text style={[styles.formToggleText, { color: formType === 'lost' ? '#FFF' : theme.colors.textSub }]}> I Lost It</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.formToggleBtn, formType === 'found' && styles.formToggleBtnActiveGreen]}
                    onPress={() => setFormType('found')}
                >
                    <Ionicons name="hand-right-outline" size={18} color={formType === 'found' ? '#FFF' : theme.colors.textSub} />
                    <Text style={[styles.formToggleText, { color: formType === 'found' ? '#FFF' : theme.colors.textSub }]}> I Found It</Text>
                </TouchableOpacity>
            </View>

            {/* Visual Identity */}
            <Text style={styles.formSectionLabel}>VISUAL IDENTITY</Text>
            <TouchableOpacity style={styles.uploadContainer} onPress={onPickImage}>
                {formImage ? (
                    <Image source={{ uri: formImage }} style={styles.uploadedImagePreview} />
                ) : (
                    <>
                        <View style={styles.cameraIconWrapper}>
                            <Ionicons name="camera" size={28} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.uploadTitle}>Capture or Upload Photo</Text>
                        <Text style={styles.uploadSub}>Recommended for faster identification</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* From My Vault - Only show if lost */}
            {formType === 'lost' && (
                <>
                    <View style={styles.vaultHeaderRow}>
                        <Text style={styles.formSectionLabel}>FROM MY VAULT</Text>
                        <TouchableOpacity onPress={onOpenVault}>
                            <Text style={styles.manageVaultText}>Manage Vault <Ionicons name="open-outline" size={12} /></Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vaultScroll}>
                        {vaultItems.length === 0 ? (
                            <Text style={styles.emptyVaultText}>Your vault is empty.</Text>
                        ) : (
                            vaultItems.map((item) => (
                                <TouchableOpacity 
                                    key={item._id} 
                                    style={styles.vaultCard}
                                    onPress={() => onSelectFromVault(item)}
                                >
                                    <Image source={{ uri: item.image }} style={styles.vaultCardImage} />
                                    <View style={styles.vaultCardContentWrapper}>
                                        <Text style={styles.vaultCardTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.vaultCardSub} numberOfLines={1}>{item.subtext}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </>
            )}

            {/* Item Title */}
            <Text style={styles.formSectionLabel}>ITEM TITLE</Text>
            <View style={styles.iconInputContainer}>
                <Ionicons name="pricetag" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                <TextInput 
                    style={styles.iconInput}
                    placeholder="e.g. Blue Backpack, MacBook Pro"
                    placeholderTextColor="#A1A5CD"
                    value={formTitle}
                    onChangeText={setFormTitle}
                />
            </View>

            {/* Location */}
            <Text style={styles.formSectionLabel}>{formType === 'lost' ? 'WHERE DID YOU LAST SEE IT?' : 'WHERE DID YOU FIND IT?'}</Text>
            <View style={styles.iconInputContainer}>
                <Ionicons name="location" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                <TextInput 
                    style={styles.iconInput}
                    placeholder="e.g. Main Library, 2nd Floor"
                    placeholderTextColor="#A1A5CD"
                    value={formLocation}
                    onChangeText={setFormLocation}
                />
            </View>

            {/* Description */}
            <Text style={styles.formSectionLabel}>
                {formType === 'found' ? 'ITEM DESCRIPTION (OPTIONAL)' : 'ITEM DESCRIPTION'}
            </Text>
            <TextInput 
                style={styles.formTextArea}
                placeholder="Describe unique markings, stickers, or brand names..."
                placeholderTextColor="#A1A5CD"
                multiline
                value={formDesc}
                onChangeText={setFormDesc}
            />

            {/* Phone Number */}
            <Text style={styles.formSectionLabel}>PHONE NUMBER</Text>
            <View style={styles.phoneInputContainer}>
                <Ionicons name="call" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                <TextInput 
                    style={styles.phoneInput}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#A1A5CD"
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                />
            </View>

            {/* Submit */}
            <TouchableOpacity 
                style={[styles.publishBtn, isLoading && { opacity: 0.7 }]} 
                onPress={onPublish}
                disabled={isLoading}
            >
                <Text style={styles.publishBtnText}>
                    {isLoading ? 'Processing...' : (isEditing ? 'Update Report' : 'Publish Report')}
                </Text>
                {!isLoading && <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            <Text style={styles.disclaimerText}>By publishing, you agree to the Campus Safety guidelines.</Text>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    formTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    formTopTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    formHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    formMainTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1E1B4B',
    },
    formStepText: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    formToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#EBECEF',
        borderRadius: 30,
        padding: 4,
        marginBottom: 30,
    },
    formToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 26,
    },
    formToggleBtnActiveBlue: {
        backgroundColor: '#1D4ED8',
        shadowColor: '#1D4ED8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    formToggleBtnActiveGreen: {
        backgroundColor: '#059669',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    formToggleText: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    formSectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    uploadContainer: {
        borderWidth: 2,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        padding: 30,
        alignItems: 'center',
        marginBottom: 30,
    },
    cameraIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E1B4B',
        marginBottom: 6,
    },
    uploadSub: {
        fontSize: 12,
        color: theme.colors.textSub,
    },
    uploadedImagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 14,
    },
    vaultHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    manageVaultText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    vaultScroll: {
        marginBottom: 30,
    },
    vaultCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        width: 140,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    vaultCardImage: {
        width: '100%',
        height: 70,
        backgroundColor: '#EBECEF',
    },
    vaultCardContentWrapper: {
        padding: 12,
    },
    vaultCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E1B4B',
        marginBottom: 2,
    },
    vaultCardSub: {
        fontSize: 10,
        color: theme.colors.textSub,
    },
    emptyVaultText: {
        textAlign: 'center',
        color: theme.colors.textSub,
        fontStyle: 'italic',
        marginTop: 10,
    },
    iconInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 30,
    },
    iconInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E1B4B',
        fontWeight: '600',
    },
    formTextArea: {
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        padding: 16,
        height: 120,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#1E1B4B',
        fontWeight: '500',
        marginBottom: 30,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E7FF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 40,
    },
    phoneInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E1B4B',
        fontWeight: '600',
    },
    publishBtn: {
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 12,
    },
    publishBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    disclaimerText: {
        textAlign: 'center',
        fontSize: 11,
        color: theme.colors.textSub,
        fontStyle: 'italic',
    },
});
