import React, {forwardRef} from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import {Pressable} from 'react-native';
import PropTypes from 'prop-types';
import _ from 'underscore';
import htmlRendererPropTypes from '../htmlRendererPropTypes';
import withLocalize from '../../../withLocalize';
import {ShowPopoverContextConsumer} from '../../../ShowPopoverContext';

const propTypes = {
    /** Press in handler for the code block */
    onPressIn: PropTypes.func,

    /** Press out handler for the code block */
    onPressOut: PropTypes.func,

    ...htmlRendererPropTypes,
};

const defaultProps = {
    onPressIn: undefined,
    onPressOut: undefined,
};

const BasePreRenderer = forwardRef((props, ref) => {
    const TDefaultRenderer = props.TDefaultRenderer;
    const defaultRendererProps = _.omit(props, ['TDefaultRenderer', 'onPressIn', 'onPressOut']);

    return (
        <ScrollView
            ref={ref}
            horizontal
        >
            <ShowPopoverContextConsumer>
                {({showPopover}) => (
                    <Pressable
                        onPressIn={props.onPressIn}
                        onPressOut={props.onPressOut}
                        onLongPress={showPopover}
                    >
                        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                        <TDefaultRenderer {...defaultRendererProps} />
                    </Pressable>
                )}
            </ShowPopoverContextConsumer>
        </ScrollView>
    );
});

BasePreRenderer.displayName = 'BasePreRenderer';
BasePreRenderer.propTypes = propTypes;
BasePreRenderer.defaultProps = defaultProps;

export default withLocalize(BasePreRenderer);
