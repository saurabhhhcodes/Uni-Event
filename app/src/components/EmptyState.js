import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Shared friendly empty state (#386): icon with a gentle float animation,
 * a headline message and an optional hint line.
 */
export default function EmptyState({ icon, title, subtitle, theme }) {
    const float = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(float, {
                    toValue: -6,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(float, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [float]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ translateY: float }] }}>
                <Ionicons
                    name={icon || 'calendar-outline'}
                    size={64}
                    color={theme.colors.textSecondary}
                    style={{ opacity: 0.5 }}
                />
            </Animated.View>
            <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
                {title || 'Nothing here yet!'}
            </Text>
            {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

EmptyState.propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    theme: PropTypes.shape({
        colors: PropTypes.shape({
            textSecondary: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', marginTop: 50, padding: 20 },
    title: { marginTop: 16, fontSize: 16, fontWeight: '600' },
    subtitle: {
        marginTop: 8,
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.75,
    },
});
