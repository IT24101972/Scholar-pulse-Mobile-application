import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, Animated, Platform, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import EventDetails from './EventDetails';
import EventCard from './EventCard';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Social', 'Academic', 'Sports', 'Workshops'];

export default function EventsScreen() {
    const { token, currentUser } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [activeCat, setActiveCat] = useState('All');
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/events?category=${activeCat}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allEvents = res.data.data;
            setEvents(allEvents);

            // Filter featured for carousel (only on initial load or "All" category)
            if (activeCat === 'All') {
                setFeaturedEvents(allEvents.filter(e => e.isFeatured));
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/400x200';
        if (url.startsWith('http')) return url;
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}${url}`;
    };

    useEffect(() => {
        fetchEvents();
    }, [activeCat]);

    // Auto-slide logic
    useEffect(() => {
        if (featuredEvents.length > 0) {
            const interval = setInterval(() => {
                let nextIndex = activeIndex === featuredEvents.length - 1 ? 0 : activeIndex + 1;
                setActiveIndex(nextIndex);
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeIndex, featuredEvents]);

    const renderBanner = ({ item }) => (
        <TouchableOpacity
            style={styles.bannerItem}
            onPress={() => {
                setSelectedEvent(item);
                setModalVisible(true);
            }}
        >
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.bannerImage} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.bannerOverlay}
            >
                <BlurView intensity={30} tint="light" style={styles.bannerTextCard}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <View style={styles.bannerSubRow}>
                        <Ionicons name="location" size={14} color={theme.colors.primary} />
                        <Text style={styles.bannerSubText}>{item.location} • {item.time}</Text>
                    </View>
                </BlurView>
            </LinearGradient>
        </TouchableOpacity>
    );

    const handleToggleInterest = async (eventId) => {
        try {
            const res = await axios.post(`${BASE_URL}/events/${eventId}/interest`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state to reflect the change immediately
            setEvents(prev => prev.map(e => {
                if (e._id === eventId) {
                    return {
                        ...e,
                        interestedUsers: res.data.isInterested
                            ? [...e.interestedUsers, currentUser._id]
                            : e.interestedUsers.filter(id => id !== currentUser._id)
                    };
                }
                return e;
            }));

            // Also update featured if it's there
            setFeaturedEvents(prev => prev.map(e => {
                if (e._id === eventId) {
                    return {
                        ...e,
                        interestedUsers: res.data.isInterested
                            ? [...e.interestedUsers, currentUser._id]
                            : e.interestedUsers.filter(id => id !== currentUser._id)
                    };
                }
                return e;
            }));

            // Also update selectedEvent if it's open in modal
            if (selectedEvent && selectedEvent._id === eventId) {
                setSelectedEvent(prev => ({
                    ...prev,
                    interestedUsers: res.data.isInterested
                        ? [...prev.interestedUsers, currentUser._id]
                        : prev.interestedUsers.filter(id => id !== currentUser._id)
                }));
            }
        } catch (error) {
            console.error('Error toggling interest:', error);
        }
    };

    const handleSetReminder = () => {
        Alert.alert('Reminder Set', 'We will notify you before the event starts! 🔔');
    };





    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchEvents(); }} />
                }
            >
                {/* Header with Title Overlaying slightly */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Discover Events</Text>
                    <Text style={styles.headerSub}>Explore what's happening on campus</Text>
                </View>

                {/* Auto-sliding Banner (Only show if featured events exist and in 'All' category) */}
                {activeCat === 'All' && featuredEvents.length > 0 && (
                    <View style={styles.carouselContainer}>
                        <Animated.FlatList
                            ref={flatListRef}
                            data={featuredEvents}
                            renderItem={renderBanner}
                            keyExtractor={item => item._id}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: false }
                            )}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setActiveIndex(index);
                            }}
                        />
                        {/* Dots indicator */}
                        <View style={styles.dotsContainer}>
                            {featuredEvents.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: activeIndex === i ? theme.colors.primary : 'rgba(0,0,0,0.1)',
                                            width: activeIndex === i ? 20 : 6
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Categories */}
                <View style={{ marginBottom: 24, marginTop: (activeCat === 'All' && featuredEvents.length > 0) ? 0 : 20 }}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryScroll}
                    >
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryBtn, activeCat === cat && styles.categoryBtnActive]}
                                onPress={() => {
                                    setIsLoading(true);
                                    setActiveCat(cat);
                                }}
                            >
                                <Text style={[styles.categoryText, activeCat === cat && styles.categoryTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Event List */}
                <View style={styles.listSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{activeCat === 'All' ? 'Upcoming for You' : `${activeCat} Events`}</Text>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        events.length > 0 ? (
                            events.map(item => (
                                <EventCard
                                    key={item._id}
                                    item={item}
                                    onPress={(event) => {
                                        setSelectedEvent(event);
                                        setModalVisible(true);
                                    }}
                                    onToggleInterest={handleToggleInterest}
                                    getImageUrl={getImageUrl}
                                    currentUserId={currentUser?._id}
                                />
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 60 }}>
                                <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
                                <Text style={{ color: '#6B7280', marginTop: 12 }}>No events found in this category</Text>
                            </View>
                        )
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <EventDetails
                event={selectedEvent}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onToggleInterest={handleToggleInterest}
                onSetReminder={handleSetReminder}
                getImageUrl={getImageUrl}
                currentUserId={currentUser?._id}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 100 : 120,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.textMain,
    },
    headerSub: {
        fontSize: 14,
        color: theme.colors.textSub,
        marginTop: 4,
    },
    carouselContainer: {
        height: 280,
        marginBottom: 30,
    },
    bannerItem: {
        width: width,
        height: 280,
        paddingHorizontal: 20,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        resizeMode: 'cover',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: '60%',
        borderRadius: 24,
        justifyContent: 'flex-end',
        padding: 24,
    },
    bannerTextCard: {
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    bannerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    bannerSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    bannerSubText: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
        marginLeft: 6,
        fontWeight: '700',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: -20,
        width: '100%',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
    },
    categoryScroll: {
        paddingHorizontal: 24,
    },
    categoryBtn: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#EBECEF',
        marginRight: 10,
    },
    categoryBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    categoryText: {
        color: theme.colors.textSub,
        fontWeight: '700',
        fontSize: 13,
    },
    categoryTextActive: {
        color: '#FFF',
    },
    listSection: {
        paddingHorizontal: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textMain,
    },
    seeAllLink: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '700',
    }
});

