import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function HistoryModal({
    visible,
    onClose,
    myItems,
    onEdit,
    onDelete,
}) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>My Post History</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={theme.colors.textSub} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                        {myItems.length === 0 ? (
                            <View style={styles.emptyHistoryContainer}>
                                <Ionicons name="receipt-outline" size={48} color={theme.colors.textSub} style={{ opacity: 0.3, marginBottom: 12 }} />
                                <Text style={styles.emptyHistoryText}>You haven't posted any items yet.</Text>
                            </View>
                        ) : (
                            myItems.map((item) => (
                                <View key={item._id} style={styles.historyListItem}>
                                    <Image source={{ uri: item.image }} style={styles.historyListImage} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <View style={styles.historyTypeTag(item.type)}>
                                            <Text style={styles.historyTypeText}>{item.type === 'lost' ? 'LOST' : 'FOUND'}</Text>
                                        </View>
                                        <Text style={styles.historyListTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.historyListSub} numberOfLines={1}>{item.date}</Text>
                                    </View>
                                    <View style={styles.historyActions}>
                                        <TouchableOpacity 
                                            style={styles.historyActionBtnEdit}
                                            onPress={() => onEdit(item)}
                                        >
                                            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.historyActionBtnDelete}
                                            onPress={() => onDelete(item._id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
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
    emptyHistoryContainer: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyHistoryText: {
        color: theme.colors.textSub,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    historyListItem: {
        flexDirection: 'row',
        backgroundColor: '#F3F4FE',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        alignItems: 'center',
    },
    historyListImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
    historyListTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.textMain,
    },
    historyListSub: {
        fontSize: 12,
        color: theme.colors.textSub,
        fontWeight: '500',
    },
    historyTypeTag: (type) => ({
        backgroundColor: type === 'lost' ? theme.colors.primaryLight : '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 4,
    }),
    historyTypeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
        color: theme.colors.textMain,
    },
    historyActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyActionBtnEdit: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    historyActionBtnDelete: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: '#FFE4E6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    }
});
