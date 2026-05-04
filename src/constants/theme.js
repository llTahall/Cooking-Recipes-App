import { Platform } from 'react-native';

export const fonts = {
    display: Platform.select({ ios: 'Georgia', android: 'serif' }),
    body: Platform.select({ ios: 'System', android: 'sans-serif' }),
};

export const spacing = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
    sm: 8, md: 12, lg: 20, xl: 28, full: 999,
};

export const shadows = {
    card: {
        shadowColor: '#4DB6AC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    elevated: {
        shadowColor: '#455A64',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
        elevation: 8,
    },
};

