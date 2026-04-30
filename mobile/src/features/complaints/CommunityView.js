import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import ReportCard from './ReportCard';
import { Ionicons } from '@expo/vector-icons';

const CommunityView = () => {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Fetch community reports error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && reports.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        );
    }

    if (reports.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.textSub} style={{ opacity: 0.4, marginBottom: 12 }} />
                <Text style={styles.emptyText}>No reports found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {reports.map((item) => (
                <ReportCard key={item._id} item={item} isOwner={false} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    centerContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 24,
    },
    emptyText: {
        color: theme.colors.textSub,
        fontSize: 15,
        fontWeight: '500',
    },
});

export default CommunityView;
