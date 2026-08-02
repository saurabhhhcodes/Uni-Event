import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    getDocs,
    doc,
    getDoc,
    where,
    updateDoc,
} from 'firebase/firestore';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getOfflineCheckInCount, syncOfflineCheckIns } from '../lib/checkInService';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Modal,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { db } from '../lib/firebaseConfig';
import { formatEventDate } from '../lib/formatEventDate';
import participantService from '../lib/participantService';
import { useTheme } from '../lib/ThemeContext';
import { sendBulkAnnouncement, sendBulkFeedbackRequest } from '../lib/EmailService';
import PropTypes from 'prop-types';
import { COLLECTIONS, getEventCheckInsPath, getEventFeedbackPath } from '../lib/firestorePaths';
import { useAuth } from '../lib/AuthContext';

export default function AttendanceDashboard({ route, navigation }) {
    const { width: screenWidth } = useWindowDimensions();
    const { eventId, eventTitle } = route.params;
    const { theme } = useTheme();

    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [departmentStats, setDepartmentStats] = useState({});
    const [yearStats, setYearStats] = useState({});
    const [eventData, setEventData] = useState(null);

    const { user } = useAuth();

    // Offline Sync State
    const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
    const [syncingOffline, setSyncingOffline] = useState(false);
    const isMountedRef = useRef(true);

    // Announcement State
    const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
    const [announcementSubject, setAnnouncementSubject] = useState('');
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Feedback Request Modal State
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

    useEffect(
        () => () => {
            isMountedRef.current = false;
        },
        [],
    );

    const handleRequestFeedback = () => {
        setFeedbackModalVisible(true);
    };

    const handleSendFeedbackRequest = async () => {
        if (sending) return;

        setSending(true);
        setFeedbackModalVisible(false);

        try {
            const snapshotData = await participantService.fetchParticipantsOnce(db, eventId);
            const participants = (snapshotData || [])
                .map(d => ({ name: d.name, email: d.email }))
                .filter(p => p.email && p.email !== '-');

            if (participants.length === 0) {
                Alert.alert('Error', 'No participants found.');
                setSending(false);
                return;
            }

            const count = await sendBulkFeedbackRequest(participants, eventTitle, eventId);

            // Update event to mark feedback as sent
            await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), {
                feedbackRequestSent: true,
                feedbackRequestSentAt: new Date().toISOString(),
            });

            Alert.alert('Success', `Feedback request sent to ${count} participants.`);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', e.message || 'Failed to send requests.');
        } finally {
            setSending(false);
        }
    };

    const handleSendAnnouncement = async () => {
        if (sending) return;

        if (!announcementSubject.trim() || !announcementMessage.trim()) {
            Alert.alert('Error', 'Please enter subject and message');
            return;
        }

        setSending(true);
        try {
            // Fetch Participants
            const snapshotData = await participantService.fetchParticipantsOnce(db, eventId);

            if (!snapshotData || snapshotData.length === 0) {
                Alert.alert('No Participants', 'No one to send email to.');
                setSending(false);
                return;
            }

            const participants = (snapshotData || [])
                .map(d => ({ name: d.name, email: d.email }))
                .filter(p => p.email && p.email !== '-');

            if (participants.length === 0) {
                Alert.alert('No Emails', 'No valid emails found.');
                setSending(false);
                return;
            }

            // Send
            const count = await sendBulkAnnouncement(
                participants,
                announcementSubject,
                announcementMessage,
            );

            Alert.alert('Success', `Sent to ${count} participants.`);
            setAnnouncementModalVisible(false);
            setAnnouncementSubject('');
            setAnnouncementMessage('');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to send.');
        } finally {
            setSending(false);
        }
    };

    // Fetch Event Data to check for Custom Form
    useEffect(() => {
        getDoc(doc(db, COLLECTIONS.EVENTS, eventId)).then(snap => {
        .catch(err => console.error(err))