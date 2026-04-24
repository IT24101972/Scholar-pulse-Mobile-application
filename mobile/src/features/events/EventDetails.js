import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

export default function EventDetails({ 
    event, 
    visible, 
    onClose, 
    onToggleInterest, 
    onSetReminder, 
    getImageUrl, 
    currentUserId 
}) {
    if (!event) return null;
    const isInterested = event.interestedUsers?.includes(currentUserId);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Sticky Close Button */}
                    <TouchableOpacity 
                        style={styles.modalCloseBtn}
                        onPress={onClose}
                    >
                        <BlurView intensity={30} tint="dark" style={styles.closeBlur}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </BlurView>
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {/* Top Image/Video with curved bottom */}
                        <View style={styles.modalImageWrapper}>
                            {event.video ? (
                                <Video
                                    source={{ uri: getImageUrl(event.video) }}
                                    rate={1.0}
                                    volume={1.0}
                                    isMuted={false}
                                    resizeMode={ResizeMode.COVER}
                                    shouldPlay={visible}
                                    isLooping
                                    style={styles.modalImage}
                                    useNativeControls={true}
                                    posterSource={{ uri: getImageUrl(event.image) }}
                                    usePoster={true}
                                    onError={(e) => console.log('Video Error:', e)}
                                />
                            ) : (
                                <Image 
                                    source={{ uri: getImageUrl(event.image) }} 
                                    style={styles.modalImage} 
                                />
                            )}
                            <LinearGradient
                                colors={['rgba(0,0,0,0.4)', 'transparent']}
                                style={styles.modalHeaderGrad}
                            />
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.modalCategoryBadge}>
                                <Text style={styles.modalCategoryText}>{event.category}</Text>
                            </View>
                            
                            <Text style={styles.modalTitle}>{event.title}</Text>
                            
                            {/* Info Strip */}
                            <View style={styles.infoStrip}>
                                <View style={styles.infoBox}>
                                    <View style={[styles.infoIconBox, { backgroundColor: '#EEF2FF' }]}>
                                        <Ionicons name="calendar" size={18} color="#4F46E5" />
                                    </View>
                                    <View>
                                        <Text style={styles.infoLabel}>DATE</Text>
                                        <Text style={styles.infoVal}>{event.date}</Text>
                                    </View>
                                </View>
                                <View style={[styles.infoBox, { marginLeft: 20 }]}>
                                    <View style={[styles.infoIconBox, { backgroundColor: '#FFF7ED' }]}>
                                        <Ionicons name="time" size={18} color="#F59E0B" />
                                    </View>
                                    <View>
                                        <Text style={styles.infoLabel}>TIME</Text>
                                        <Text style={styles.infoVal}>{event.time}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.sectionHeading}>About Event</Text>
                                <Text style={styles.modalDescription}>{event.description}</Text>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.sectionHeading}>Location</Text>
                                <View style={styles.modalLocationRow}>
                                    <View style={styles.locIconCirc}>
                                        <Ionicons name="location" size={20} color={theme.colors.primary} />
                                    </View>
                                    <Text style={styles.modalLocationText}>{event.location}</Text>
                                </View>
                            </View>
                            
                            <View style={{ height: 140 }} />
                        </View>
                    </ScrollView>

                    {/* Footer Action */}
                    <BlurView intensity={80} tint="light" style={styles.modalFooter}>
                         <View style={styles.footerAttendees}>
                            <Text style={styles.attendeeCount}>
                                {(event.baseInterestedCount || 0) + (event.interestedUsers?.length || 0)}+
                            </Text>
                            <Text style={styles.attendeeLabel}>Interested Students</Text>
                         </View>
                         
                         <View style={styles.modalActionGroup}>
                            <TouchableOpacity 
                                style={styles.modalActionCircle}
                                onPress={onSetReminder}
                            >
                                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalActionCircle, isInterested && { backgroundColor: '#FEE2E2' }]}
                                onPress={() => onToggleInterest(event._id)}
                            >
                                <Ionicons 
                                    name={isInterested ? "heart" : "heart-outline"} 
                                    size={24} 
                                    color={isInterested ? "#EF4444" : "#6B7280"} 
                                />
                            </TouchableOpacity>
                         </View>
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        height: '92%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    modalImageWrapper: {
        width: '100%',
        height: 350,
        position: 'relative',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalHeaderGrad: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    closeBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    modalBody: {
        padding: 24,
        marginTop: -30,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    modalCategoryBadge: {
        backgroundColor: '#10B9811A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    modalCategoryText: {
        color: '#10B981',
        fontWeight: '800',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.textMain,
        marginBottom: 24,
        lineHeight: 36,
    },
    infoStrip: {
        flexDirection: 'row',
        marginBottom: 32,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '800',
        letterSpacing: 1,
    },
    infoVal: {
        fontSize: 14,
        color: theme.colors.textMain,
        fontWeight: '700',
        marginTop: 2,
    },
    modalSection: {
        marginBottom: 24,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginBottom: 12,
    },
    modalDescription: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        fontWeight: '500',
    },
    modalLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    locIconCirc: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalLocationText: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    modalFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerAttendees: {
        flex: 1,
    },
    attendeeCount: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.textMain,
    },
    attendeeLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    modalActionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalActionCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    }
});
