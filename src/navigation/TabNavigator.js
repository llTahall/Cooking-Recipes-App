import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import HomeStack from './HomeStack';
import SearchStack from './SearchStack';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const TABS = [
    { name: 'HomeTab', component: HomeStack, label: 'Home' },
    { name: 'SearchTab', component: SearchStack, label: 'Discover' },
    { name: 'PlannerTab', component: MealPlannerScreen, label: 'Planner' },
    { name: 'ProfileTab', component: ProfileStack, label: 'Profile' },
];

const BAR_PADDING = 6;

function CustomTabBar({ state, navigation }) {
    const slideAnim = useRef(new Animated.Value(state.index)).current;
    const [barWidth, setBarWidth] = useState(0);

    const numTabs = TABS.length;
    const pillWidth = barWidth > 0 ? barWidth / numTabs : 0;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: state.index,
            useNativeDriver: true,
            tension: 68,
            friction: 11,
        }).start();
    }, [state.index]);

    const translateX = slideAnim.interpolate({
        inputRange: TABS.map((_, i) => i),
        outputRange: TABS.map((_, i) => i * pillWidth),
    });

    return (
        <View style={styles.wrapper}>
            <View
                style={styles.bar}
                onLayout={e => setBarWidth(e.nativeEvent.layout.width - BAR_PADDING * 2)}
            >
                {barWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.slidingPill,
                            { width: pillWidth, transform: [{ translateX }] },
                        ]}
                    />
                )}
                {state.routes.map((route, index) => {
                    const label = TABS.find(t => t.name === route.name)?.label ?? route.name;
                    const focused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                    };

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabItem}
                            android_ripple={null}
                        >
                            <Text style={[styles.label, focused && styles.labelActive]}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            {TABS.map(tab => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name}
                    component={tab.component}
                />
            ))}
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    bar: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 28,
        paddingVertical: 10,
        paddingHorizontal: BAR_PADDING,
        alignItems: 'center',
        shadowColor: '#455A64',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
    },
    slidingPill: {
        position: 'absolute',
        left: BAR_PADDING,
        top: 6,
        bottom: 6,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 11,
        zIndex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.subtitle,
        letterSpacing: 0.1,
    },
    labelActive: {
        color: colors.primaryDark,
        fontWeight: '700',
    },
});
