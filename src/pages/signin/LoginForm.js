import React from 'react';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import _ from 'underscore';
import Str from 'expensify-common/lib/str';
import {parsePhoneNumber} from 'awesome-phonenumber';
import styles from '../../styles/styles';
import Text from '../../components/Text';
import * as Session from '../../libs/actions/Session';
import ONYXKEYS from '../../ONYXKEYS';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../components/withWindowDimensions';
import compose from '../../libs/compose';
import canFocusInputOnScreenFocus from '../../libs/canFocusInputOnScreenFocus';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import TextInput from '../../components/TextInput';
import * as ValidationUtils from '../../libs/ValidationUtils';
import * as LoginUtils from '../../libs/LoginUtils';
import withToggleVisibilityView, {toggleVisibilityViewPropTypes} from '../../components/withToggleVisibilityView';
import FormAlertWithSubmitButton from '../../components/FormAlertWithSubmitButton';
import {withNetwork} from '../../components/OnyxProvider';
import networkPropTypes from '../../components/networkPropTypes';
import * as ErrorUtils from '../../libs/ErrorUtils';
import DotIndicatorMessage from '../../components/DotIndicatorMessage';
import * as CloseAccount from '../../libs/actions/CloseAccount';
import CONST from '../../CONST';

const propTypes = {
    /** Should we dismiss the keyboard when transitioning away from the page? */
    blurOnSubmit: PropTypes.bool,

    /* Onyx Props */

    /** The details about the account that the user is signing in with */
    account: PropTypes.shape({
        /** An error message to display to the user */
        errors: PropTypes.objectOf(PropTypes.string),

        /** Success message to display when necessary */
        success: PropTypes.string,

        /** Whether or not a sign on form is loading (being submitted) */
        isLoading: PropTypes.bool,
    }),

    closeAccount: PropTypes.shape({
        /** Message to display when user successfully closed their account */
        success: PropTypes.string,
    }),

    /** Props to detect online status */
    network: networkPropTypes.isRequired,

    ...windowDimensionsPropTypes,

    ...withLocalizePropTypes,

    ...toggleVisibilityViewPropTypes,
};

const defaultProps = {
    account: {},
    closeAccount: {},
    blurOnSubmit: false,
};

class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.onTextInput = this.onTextInput.bind(this);
        this.validateAndSubmitForm = this.validateAndSubmitForm.bind(this);

        this.state = {
            formError: false,
            login: '',
        };

        if (this.props.account.errors || this.props.account.isLoading) {
            Session.clearAccountMessages();
        }
    }

    componentDidMount() {
        if (!canFocusInputOnScreenFocus() || !this.input || !this.props.isVisible) {
            return;
        }
        this.input.focus();
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.blurOnSubmit && this.props.blurOnSubmit) {
            this.input.blur();
        }
        if (prevProps.isVisible || !this.props.isVisible) {
            return;
        }
        this.input.focus();
    }

    /**
     * Handle text input and clear formError upon text change
     *
     * @param {String} text
     */
    onTextInput(text) {
        this.setState({
            login: text,
            formError: null,
        });

        if (this.props.account.errors) {
            Session.clearAccountMessages();
        }

        // Clear the "Account successfully closed" message when the user starts typing
        if (this.props.closeAccount.success) {
            CloseAccount.setDefaultData();
        }
    }

    /**
     * Clear Login from the state
     */
    clearLogin() {
        this.setState({login: ''}, this.input.clear);
    }

    /**
     * Check that all the form fields are valid, then trigger the submit callback
     */
    validateAndSubmitForm() {
        if (this.props.network.isOffline) {
            return;
        }

        // If account was closed and have success message in Onyx, we clear it here
        if (!_.isEmpty(this.props.closeAccount.success)) {
            CloseAccount.setDefaultData();
        }

        const login = this.state.login.trim();
        if (!login) {
            this.setState({formError: 'common.pleaseEnterEmailOrPhoneNumber'});
            return;
        }

        const phoneLogin = LoginUtils.appendCountryCode(LoginUtils.getPhoneNumberWithoutSpecialChars(login));
        const parsedPhoneNumber = parsePhoneNumber(phoneLogin);

        if (!Str.isValidEmail(login) && !parsedPhoneNumber.possible) {
            if (ValidationUtils.isNumericWithSpecialChars(login)) {
                this.setState({formError: 'common.error.phoneNumber'});
            } else {
                this.setState({formError: 'loginForm.error.invalidFormatEmailLogin'});
            }
            return;
        }

        this.setState({
            formError: null,
        });

        // Check if this login has an account associated with it or not
        Session.beginSignIn(parsedPhoneNumber.possible ? parsedPhoneNumber.number.e164 : login);
    }

    render() {
        const formErrorText = this.state.formError ? this.props.translate(this.state.formError) : '';
        const serverErrorText = ErrorUtils.getLatestErrorMessage(this.props.account);
        const hasError = !_.isEmpty(serverErrorText);
        return (
            <>
                <View accessibilityLabel={this.props.translate('loginForm.loginForm')} style={[styles.mt3]}>
                    <TextInput
                        ref={el => this.input = el}
                        label={this.props.translate('loginForm.phoneOrEmail')}
                        value={this.state.login}
                        autoCompleteType="username"
                        textContentType="username"
                        nativeID="username"
                        name="username"
                        onChangeText={this.onTextInput}
                        onSubmitEditing={this.validateAndSubmitForm}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={CONST.KEYBOARD_TYPE.EMAIL_ADDRESS}
                        errorText={formErrorText}
                        hasError={hasError}
                    />
                </View>
                {!_.isEmpty(this.props.account.success) && (
                    <Text style={[styles.formSuccess]}>
                        {this.props.account.success}
                    </Text>
                )}
                {!_.isEmpty(this.props.closeAccount.success) && (

                    // DotIndicatorMessage mostly expects onyxData errors, so we need to mock an object so that the messages looks similar to prop.account.errors
                    <DotIndicatorMessage style={[styles.mv2]} type="success" messages={{0: this.props.closeAccount.success}} />
                )}
                { // We need to unmount the submit button when the component is not visible so that the Enter button
                  // key handler gets unsubscribed and does not conflict with the Password Form
                    this.props.isVisible && (
                        <View style={[styles.mt5]}>
                            <FormAlertWithSubmitButton
                                buttonText={this.props.translate('common.continue')}
                                isLoading={this.props.account.isLoading}
                                onSubmit={this.validateAndSubmitForm}
                                message={serverErrorText}
                                isAlertVisible={!_.isEmpty(serverErrorText)}
                                containerStyles={[styles.mh0]}
                            />
                        </View>
                    )
                }
            </>
        );
    }
}

LoginForm.propTypes = propTypes;
LoginForm.defaultProps = defaultProps;

export default compose(
    withOnyx({
        account: {key: ONYXKEYS.ACCOUNT},
        closeAccount: {key: ONYXKEYS.FORMS.CLOSE_ACCOUNT_FORM},
    }),
    withWindowDimensions,
    withLocalize,
    withToggleVisibilityView,
    withNetwork(),
)(LoginForm);
