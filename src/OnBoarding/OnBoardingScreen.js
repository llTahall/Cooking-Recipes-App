import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDispatch } from 'react-redux';
import { colors } from '../constants/colors';
import { updateProfile, setResults } from '../store/slices/profileSlice';
import { WelcomePage } from './pages/WelcomePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import BodyStatsPage from './pages/BodyStatsPage';
import GoalPage from './pages/GoalPage';
import ActivityPage from './pages/ActivityPage';
import ResultsPage from './pages/ResultsPage';
import { calculateMacros } from './pages/ResultsPage';


export default function OnboardingScreen({ onOnboarded }) {



    const dispatch = useDispatch();
    const [showPermissions, setShowPermissions] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        sex: 'male',
        weight: '',
        height: '',
        age: '',
        goal: 'maintain',
        activity: 'moderate',
    });
    const formDataRef = useRef(formData);
    formDataRef.current = formData;
    const update = (field, value) => { setFormData({ ...formData, [field]: value, }); };


    const pages = [
        WelcomePage,
        {
            backgroundColor: colors.background,
            image: <PersonalInfoPage formData={formData} onChange={update} />,
            title: '',
            subtitle: '',
        },
        {
            backgroundColor: colors.background,
            image: <BodyStatsPage formData={formData} onChange={update} />,
            title: '',
            subtitle: '',
        },
        {
            backgroundColor: colors.background,
            image: <GoalPage value={formData.goal} onChange={v => update('goal', v)} />,
            title: '',
            subtitle: '',
        },
        {
            backgroundColor: colors.background,
            image: <ActivityPage value={formData.activity} onChange={v => update('activity', v)} />,
            title: '',
            subtitle: '',
        },
        {
            backgroundColor: colors.background,
            image: <ResultsPage formData={formData} />,
            title: '',
            subtitle: '',
        },
    ];

    const handleDone = async () => {
        if (!formData.firstName || !formData.lastName) {
            alert('Please enter your first and last name');
            return;
        }
        if (!formData.weight || !formData.height || !formData.age) {
            alert('Please fill in your body stats');
            return;
        }
        const results = calculateMacros(formDataRef.current);
        await AsyncStorage.setItem('userProfile', JSON.stringify(formData));
        await AsyncStorage.setItem('onboarded', 'true');
        dispatch(updateProfile(formData));
        dispatch(setResults(results));
        setShowPermissions(true);
    };

    const handlePermissions = async () => {
        await Notifications.requestPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
        setShowPermissions(false);
        onOnboarded();
    };

    return (
        <>
            <Onboarding
                pages={pages}
                onDone={handleDone}
                onSkip={handleDone}
                dotStyle={{ backgroundColor: colors.border }}
                selectedDotStyle={{ backgroundColor: colors.primary }}
                titleStyles={{ color: colors.text }}
                subTitleStyles={{ color: colors.subtitle }}
            />


            <Modal visible={showPermissions} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Before you start 🌿</Text>
                        <Text style={styles.modalText}>
                            NutriFlow needs access to your{'\n'}
                            <Text style={styles.bold}>camera</Text> to add recipe photos and{'\n'}
                            <Text style={styles.bold}>notifications</Text> to remind you of your meal plan.
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={handlePermissions}>
                            <Text style={styles.buttonText}>Allow & Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modal: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 28,
        width: '82%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    modalText: {
        fontSize: 15,
        color: colors.subtitle,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    bold: { fontWeight: '700', color: colors.text },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    buttonText: { color: colors.background, fontWeight: '700', fontSize: 16 },
});
