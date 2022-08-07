import React from 'react';
import PropTypes from 'prop-types';
import {
    // eslint-disable-next-line no-restricted-imports
    InteractionManager, Keyboard, ScrollView, TextInput,
} from 'react-native';
import _ from 'underscore';
import styles from '../../styles/styles';

const propTypes = {
    /** Form elements */
    children: PropTypes.node.isRequired,

    /** A ref to forward to the scroll view */
    forwardedRef: PropTypes.func,
};

const defaultProps = {
    forwardedRef: null,
};

class FormScrollView extends React.Component {
    constructor(props) {
        super(props);
        this.keyboardHeight = 0;
        this.scrollPosition = 0;
        this.adjustScrollPosition = this.adjustScrollPosition.bind(this);
    }

    componentDidMount() {
        this.keyboardDidChangeFrameSubscription = Keyboard.addListener('keyboardDidChangeFrame', this.adjustScrollPosition);
    }

    componentWillUnmount() {
        this.keyboardDidChangeFrameSubscription.remove();
    }

    adjustScrollPosition(keyboardFrame) {
        const oldKeyboardHeight = this.keyboardHeight;
        this.keyboardHeight = keyboardFrame.endCoordinates.height;
        if (oldKeyboardHeight === 0 || oldKeyboardHeight === keyboardFrame.endCoordinates.height) {
            // Keyboard first time pop out or keyboard size does not change, ScrollView can
            // scroll to focused TextInput automaticlly, we don't need to deal with it
            return;
        }

        const currentlyFocusedRef = TextInput.State.currentlyFocusedInput();
        if (currentlyFocusedRef) {
            currentlyFocusedRef.measureInWindow((x, y, width, height) => {
                const textInputBottomPosition = y + height;
                const blockedHeight = textInputBottomPosition - keyboardFrame.endCoordinates.screenY;
                if (blockedHeight > 0) {
                    // Text input get blocked, manually scroll to the right position
                    const newScrollPosition = this.scrollPosition + blockedHeight;
                    InteractionManager.runAfterInteractions(() => this.form.scrollTo({y: newScrollPosition}));
                }
            });
        }
    }

    render() {
        return (
            <ScrollView
                style={[styles.w100, styles.flex1]}
                ref={(ref) => {
                    this.form = ref;
                    if (_.isFunction(this.props.forwardedRef)) {
                        this.props.forwardedRef(ref);
                    }
                }}
                onScroll={(event) => {
                    this.scrollPosition = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                contentContainerStyle={styles.flexGrow1}
                keyboardShouldPersistTaps="handled"
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...this.props}
            >
                {this.props.children}
            </ScrollView>
        );
    }
}

FormScrollView.propTypes = propTypes;
FormScrollView.defaultProps = defaultProps;

export default React.forwardRef((props, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FormScrollView {...props} forwardedRef={ref} />
));
