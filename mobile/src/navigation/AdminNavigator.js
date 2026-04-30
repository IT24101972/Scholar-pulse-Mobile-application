import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../theme/theme';

// Import Screens
import AdminDashboardScreen from '../features/admin/AdminDashboardScreen';
import HomeScreen from '../features/notices/HomeScreen';
import EventsScreen from '../features/events/EventsScreen';
import ReportsScreen from '../features/complaints/ReportsScreen';
import ResourcesScreen from '../features/resources/ResourcesScreen';
import ClubsScreen from '../features/clubs/ClubsScreen';
import LostFoundScreen from '../features/lostfound/LostFoundScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import AdminEventManagementScreen from '../features/admin/events/AdminEventManagementScreen';
import AdminNoticeManagementScreen from '../features/admin/notices/AdminNoticeManagementScreen';
import AdminClubManagementScreen from '../features/admin/clubs/AdminClubManagementScreen';
import AdminComplaintsScreen from '../features/admin/complaints/AdminComplaintsScreen';
import AdminLostFoundScreen from '../features/admin/lostfound/AdminLostFoundScreen';

const Tab = createBottomTabNavigator();

// Configuration for icons
const TAB_ICONS = {
    Dashboard: 'grid',
    Notices: 'home',
    Events: 'calendar',
    Reports: 'megaphone',
    Resources: 'folder-open',
    Clubs: 'people',
    LostFound: 'search',
    Profile: 'person-circle'
};

// Custom Bottom Tab Bar Component (with Glassmorphism)
function CustomTabBar({ state, descriptors, navigation }) {
    return (
        <View style={styles.absoluteTabContainer}>
            <BlurView intensity={90} tint="light" style={styles.blurContainer}>
                <SafeAreaView>
                    <View style={styles.tabContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {state.routes.filter(r => TAB_ICONS[r.name]).map((route, index) => {
                                const { options } = descriptors[route.key];
                                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
                                const isFocused = state.index === index;

                                const onPress = () => {
                                    const event = navigation.emit({
                                        type: 'tabPress',
                                        target: route.key,
                                        canPreventDefault: true,
                                    });

                                    if (!isFocused && !event.defaultPrevented) {
                                        navigation.navigate(route.name);
                                    }
                                };

                                const iconName = TAB_ICONS[route.name] || 'ellipse';
                                const color = isFocused ? theme.colors.primary : theme.colors.textSub;

                                return (
                                    <TouchableOpacity
                                        key={route.key}
                                        accessibilityRole="button"
                                        accessibilityState={isFocused ? { selected: true } : {}}
                                        onPress={onPress}
                                        style={[styles.tabButton, isFocused && styles.tabButtonActive]}
                                    >
                                        <Ionicons name={iconName} size={24} color={color} />
                                        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </BlurView>
        </View>
    );
}

export default function AdminNavigator() {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ 
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerBackground: () => (
                    <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                ),
                headerTitleAlign: 'left',
                headerTitle: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.primary }}>
                            ScholarPulse <Text style={{ fontSize: 14, color: '#6B7280' }}>(Admin)</Text>
                        </Text>
                    </View>
                ),
                headerRight: () => (
                    <TouchableOpacity style={{ marginRight: 16, backgroundColor: 'rgba(238, 239, 250, 0.7)', padding: 8, borderRadius: 20 }}>
                        <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                )
            }}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
            <Tab.Screen name="Notices" component={HomeScreen} />
            <Tab.Screen name="Events" component={EventsScreen} />
            <Tab.Screen name="Reports" component={ReportsScreen} />
            <Tab.Screen name="Resources" component={ResourcesScreen} />
            <Tab.Screen name="Clubs" component={ClubsScreen} />
            <Tab.Screen name="LostFound" component={LostFoundScreen} options={{ tabBarLabel: 'Find' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen 
                name="AdminEventManagement" 
                component={AdminEventManagementScreen} 
                options={{ headerShown: false }} 
            />
            <Tab.Screen 
                name="AdminNoticeManagement" 
                component={AdminNoticeManagementScreen} 
                options={{ headerShown: false }} 
            />
            <Tab.Screen 
                name="AdminClubManagement" 
                component={AdminClubManagementScreen} 
                options={{ headerShown: false }} 
            />
            <Tab.Screen 
                name="AdminComplaints" 
                component={AdminComplaintsScreen} 
                options={{ headerShown: false }} 
            />
            <Tab.Screen 
                name="AdminLostFound" 
                component={AdminLostFoundScreen} 
                options={{ headerShown: false }} 
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    absoluteTabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
    },
    blurContainer: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    tabContainer: {
        height: 60,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        height: '100%',
        minWidth: 80,
    },
    tabButtonActive: {
        borderTopWidth: 3,
        borderTopColor: theme.colors.primary,
        marginTop: -3, 
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600'
    }
});
