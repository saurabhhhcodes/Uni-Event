import React from 'react';
import { render } from '@testing-library/react-native';
import EmptyState from '../EmptyState';

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const PropTypes = require('prop-types');
    const { Text } = require('react-native');

    const MockIcon = ({ name }) => React.createElement(Text, null, name);
    MockIcon.propTypes = {
        name: PropTypes.string,
    };

    return {
        Ionicons: MockIcon,
    };
});

const theme = {
    colors: {
        textSecondary: '#666',
    },
};

describe('EmptyState', () => {
    it('renders the title and subtitle', () => {
        const { getByText } = render(
            <EmptyState
                icon="calendar-outline"
                title="No events yet!"
                subtitle="Check back soon for new events near you."
                theme={theme}
            />,
        );

        expect(getByText('No events yet!')).toBeTruthy();
        expect(getByText('Check back soon for new events near you.')).toBeTruthy();
        expect(getByText('calendar-outline')).toBeTruthy();
    });

    it('does not render a subtitle when none is provided', () => {
        const { queryByText, getByText } = render(
            <EmptyState icon="search-outline" title="No results" theme={theme} />,
        );

        expect(getByText('No results')).toBeTruthy();
        expect(queryByText(/Check back soon/)).toBeNull();
    });

    it('falls back to the default title when omitted', () => {
        const { getByText } = render(<EmptyState theme={theme} />);
        expect(getByText('Nothing here yet!')).toBeTruthy();
    });
});
