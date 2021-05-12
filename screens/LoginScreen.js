/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React, { useState, useContext, useEffect } from 'react';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import {
    StyleSheet,
    View,
    Alert,
    Platform,
    TextInput,
    Text,
    TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';
import * as Facebook from 'expo-facebook';
import { Col, Grid } from 'react-native-easy-grid';
import { ActivityIndicator } from 'react-native-paper';
import { ExtraProps } from "../context/context";
import GetApiListData from '../api/GetApiListData';
import ReportError from '../api/ReportError';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export default function LoginScreen({ navigation }) {
    const [Email, setEmail] = useState('');
    const [UserData, setUserData] = useState('');
    const [logginInLoading, setLogginInLoading] = useState(false);
    const [fbLogginInLoading, setFbLogginInLoading] = useState(false);
    const [passWord, setPassWord] = useState('');

    const extraProps = useContext(ExtraProps);

    useEffect(() => {
        Linking.addEventListener('url', _handleRedirect);
        return () => {
            Linking.removeEventListener('url', _handleRedirect);
        };
    }, [])

    useEffect(() => {
        if (Object.values(UserData).length > 0) {
            console.log('test')
            _getLocationAndNavigate();
        }
    }, [UserData])

    async function logInFB() {
        try {
            setFbLogginInLoading(true)
            await Facebook.initializeAsync({ appId: '', appName: 'Representin' });
            const {
                type,
                token,
            } = await Facebook.logInWithReadPermissionsAsync(
                {
                    permissions: ['public_profile', 'email']
                }
            );
            if (type === 'success') {
                // Get the user's name using Facebook's Graph API
                // eslint-disable-next-line no-undef
                const Fbresponse = await fetch(
                    `https://graph.facebook.com/v3.2/me?access_token=${token}&fields=id,email,name,first_name,last_name,gender,picture.type(large)`
                );
                try {
                    if (Object.prototype.hasOwnProperty.call(Fbresponse, "error")) {
                        ReportError._reportError(15, 'Facebook login error ' + Fbresponse.error.message, false);
                        setFbLogginInLoading(false);
                        alert('Er is momenteel een tijdelijke Facebook login error! Probeer een andere login methode.')
                    } else {
                        _registerFB(await Fbresponse.json());
                    }
                } catch (e) {
                    console.log(e)
                }
            } else {
                console.log('canceled');
                setFbLogginInLoading(false)
            }
        } catch ({ message }) {
            // eslint-disable-next-line no-undef
            alert(`Facebook Login Error: ${message}`);
        }
    }

    async function _registerFB(Fbresult) {
        const FbResult = {
            FbFirstName: Fbresult.first_name,
            FbSurname: Fbresult.last_name,
            FbEmail: Fbresult.email,
            FbProfilePicture: Fbresult.picture.data.url
        };
        if (typeof FbResult.FbEmail !== 'undefined') {
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'registerFB',
                    firstName: FbResult.FbFirstName,
                    lastName: FbResult.FbSurname,
                    fbPfPictureUri: FbResult.FbProfilePicture,
                    email: FbResult.FbEmail
                }
            )
            if (
                responseJson !== '404' &&
                responseJson !== '405' &&
                responseJson !== 'AR'
            ) {
                try {
                    let obj = {
                        UserID: responseJson.UserID,
                        ProfileID: responseJson.ProfileID,
                        FirstName: FbResult.FbFirstName,
                        LastName: FbResult.FbSurname,
                        Email: FbResult.FbEmail,
                        FbPicture: FbResult.FbProfilePicture
                    };
                    SecureStore.setItemAsync(
                        'userData',
                        JSON.stringify(obj)
                    ).then(() => {
                        if (obj.UserID == '0' || typeof obj.UserID == 'undefined') {
                            SecureStore.setItemAsync(
                                'userData',
                                JSON.stringify(null)
                            ).then(() => {
                                alert('Oops er ging iets mis met de login!')
                                console.log('UserID Unkown!! 117')
                                setFbLogginInLoading(false)
                            })
                        } else {
                            setUserData(obj)
                        }
                    })
                } catch (error) {
                    // eslint-disable-next-line no-undef
                    alert(
                        'Er ging iets mis, probeer het later opnieuw '
                            .error
                    );
                    setFbLogginInLoading(false);
                }
            } else if (responseJson == '404') {
                Alert.alert(
                    'Error',
                    'Er is iets fout gegaan: No Request, Probeer het later opnieuw.',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
                setFbLogginInLoading(false);
            } else if (responseJson == '405') {
                Alert.alert(
                    'Error',
                    'Er is iets fout gegaan: No DB conn, Probeer het later opnieuw.',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
                setFbLogginInLoading(false);
            } else if (responseJson == 'AR') {
                try {
                    let obj = {
                        UserID: responseJson.UserID,
                        ProfileID: responseJson.ProfileID,
                        FirstName: FbResult.FbFirstName,
                        LastName: FbResult.FbSurname,
                        Email: FbResult.FbEmail,
                        FbPicture: FbResult.FbProfilePicture
                    };
                    if (obj.UserID == '0' || typeof obj.UserID == 'undefined') {
                        SecureStore.setItemAsync(
                            'userData',
                            JSON.stringify(null)
                        ).then(() => {
                            alert('Oops er ging iets mis met de login!')
                            console.log('UserID Unkown!! 177')
                            setFbLogginInLoading(false)
                        })
                    } else {
                        let setUserData = await SecureStore.setItemAsync('userData', JSON.stringify(obj));
                        setUserData(obj)
                    }
                } catch (error) {
                    // eslint-disable-next-line no-undef
                    alert(
                        'Er ging iets mis, probeer het later opnieuw '
                            .error
                    );
                    setFbLogginInLoading(false);
                }
            } else {
                Alert.alert(
                    'Controleer je invoer',
                    'Vul alle velden in',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
                setFbLogginInLoading(false);
            }
        } else {
            Alert.alert(
                'Niet gelukt',
                'Je moet toegang geven tot je gegevens',
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
            setFbLogginInLoading(false);
        }
    }

    async function _askLocationPermission() {
        _getLocationAndNavigate();
    }

    async function _askPermission() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('asking for permission')
            Alert.alert(
                'Locatie',
                'Je moet toegang tot je locatie geven voor deze app. Deze wordt enkel gebruikt binnen de app.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (Platform.OS == 'ios') {
                                Linking.openURL(
                                    'app-settings://location/com.representin.representin'
                                );
                                Alert.alert(
                                    'Locatie',
                                    'Klik op "Ok" om verder te gaan',
                                    [
                                        {
                                            text: 'Ok',
                                            onPress: () => {
                                                _askLocationPermission();
                                            }
                                        }
                                    ]
                                );
                            } else {
                                _askLocationPermission();
                            }
                        }
                    }
                ],
                { cancelable: false }
            );
        } else if (status == 'granted') {
            if (UserData !== '' && UserData !== null) {
                _getLocationAndNavigate();
            }
        }
    }

    async function _getLocationAndNavigate() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' && Platform.OS !== 'ios') {
            _askPermission();
        } else if (status == 'granted') {
            extraProps.loggingIn(false);
            extraProps.onSignIn(true);
            extraProps.locationPermission(true)
            extraProps.userData(UserData)
        } else if (Platform.OS === 'ios' && status === 'denied') {
            extraProps.loggingIn(true);
            extraProps.locationPermission('ios')
            extraProps.userData(UserData)
        }
    }

    async function _handleRedirect(event) {
        let test = Linking.parse(event.url);
        let strippedUrl = test.path.replace('app/', '');
        // eslint-disable-next-line no-undef
        let responseJson = await GetApiListData._fetchRequest({
            action: 'checkIfKeyValid',
            key: strippedUrl
        })
        if (strippedUrl !== '' && responseJson == '1') {
            navigation.navigate('Reset', {
                key: strippedUrl
            });
        } else if (
            strippedUrl !== '' &&
            responseJson == '0' &&
            test.path.includes('representin')
        ) {
            Alert.alert(
                'Niet gelukt',
                'Deze link is niet (meer) geldig, probeer het opnieuw.'
            );
        }
    }

    async function userLogin() {
        setLogginInLoading(true)
        if (Email !== '' && passWord !== '') {
            let responseJson = await GetApiListData._fetchRequest(
                {
                    action: 'login',
                    email: Email,
                    password: passWord
                }
            )
            if (
                responseJson !== '' &&
                responseJson !== '0' &&
                responseJson.OldUser !== 1
            ) {
                try {
                    SecureStore.setItemAsync(
                        'userData',
                        JSON.stringify(responseJson)
                    ).then(() => {
                        if (responseJson.UserID == '0' || typeof responseJson.UserID == 'undefined') {
                            SecureStore.setItemAsync(
                                'userData',
                                JSON.stringify(null)
                            ).then(() => {
                                alert('Oops er ging iets mis met de login!')
                                console.log('UserID Unkown!! 360')
                                setLogginInLoading(false)
                            })
                        } else {
                            setUserData(responseJson)
                        }
                    })
                } catch (error) {
                    // eslint-disable-next-line no-undef
                    alert(
                        'Er ging iets mis, probeer het later opnieuw '
                            .error
                    );
                }
            } else if (responseJson.OldUser == 1) {
                setLogginInLoading(false)
                Alert.alert(
                    'Reset',
                    'Je wachtwoord is gereset omdat je op de oude Representin app een account hebt gemaakt, maak een nieuw wachtwoord aan via de mail verstuurd naar ' +
                    Email +
                    '.',
                    [
                        {
                            text: 'OK',
                            onPress: () =>
                                _sendUserMailToReset(
                                    responseJson.FirstName,
                                    responseJson.UserID
                                )
                        }
                    ],
                    { cancelable: false }
                );
            } else if (responseJson == '404') {
                setLogginInLoading(false)
                Alert.alert(
                    'Error',
                    'Er is iets fout gegaan: No Request, Probeer het later opnieuw.',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
            } else if (responseJson == '405') {
                setLogginInLoading(false)
                Alert.alert(
                    'Error',
                    'Er is iets fout gegaan: Geen verbinding mogelijk met Representin, Probeer het later opnieuw.',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
            } else {
                setLogginInLoading(false)
                Alert.alert(
                    'Niet gelukt',
                    'Controleer je email en wachtwoord',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('OK Pressed')
                        }
                    ],
                    { cancelable: false }
                );
            }
        } else {
            setLogginInLoading(false)
            Alert.alert(
                'Controleer je invoer',
                'Email of wachtwoord mag niet leeg zijn',
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
        }
    }

    async function _sendUserMailToReset(FirstName) {
        if (Email !== '') {
            // eslint-disable-next-line no-undef
            await GetApiListData._fetchRequest({
                action: 'sendUserMailToReset',
                firstName: FirstName,
                email: Email
            })
        } else {
            Alert.alert(
                'Controleer je invoer',
                'Email of wachtwoord mag niet leeg zijn',
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
                { cancelable: false }
            );
        }
    }

    return (
        <KeyboardAwareScrollView keyboardShouldPersistTaps={"always"} contentContainerStyle={{ flexGrow: 1 }}>
            <Grid>
                <Col style={styles.container}>
                    <TextInput
                        placeholder='Email'
                        textContentType='emailAddress'
                        containerStyle={{ width: '80%' }}
                        style={styles.emailInput}
                        keyboardType='email-address'
                        onChangeText={Email => setEmail(Email)}
                        editable={!fbLogginInLoading}
                    />
                    <TextInput
                        placeholder='Wachtwoord'
                        textContentType='password'
                        containerStyle={{ width: '80%' }}
                        style={styles.passWordInput}
                        onChangeText={passWord => setPassWord(passWord)}
                        secureTextEntry={true}
                        editable={!fbLogginInLoading}
                    />
                    <View
                        style={{
                            width: '80%',
                            marginTop: 20
                        }}
                    >
                        <TouchableOpacity
                            onPress={userLogin}
                            activeOpacity={0.9}
                            style={{
                                backgroundColor: 'black',
                                flexDirection: 'row',
                                padding: 10,
                                marginBottom: 5,
                                borderRadius: 3
                            }}
                            disabled={fbLogginInLoading}
                        >
                            <Grid>
                                <Col
                                    style={{
                                        width: '25%'
                                    }}
                                />
                                <Col
                                    style={{
                                        width: '50%',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: 16
                                        }}
                                    >
                                        Inloggen
                                </Text>
                                </Col>
                                <Col
                                    style={{
                                        width: '25%',
                                        alignItems: 'flex-end'
                                    }}
                                >
                                    <ActivityIndicator
                                        animating={logginInLoading}
                                        size='small'
                                        color='white'
                                    />
                                </Col>
                            </Grid>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '80%',
                            marginTop: 5
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={{
                                backgroundColor: 'black',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                padding: 10,
                                marginBottom: 5,
                                borderRadius: 3
                            }}
                            activeOpacity={0.9}
                            disabled={fbLogginInLoading}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    alignSelf: 'center',
                                    fontWeight: 'bold',
                                    fontSize: 16
                                }}
                            >
                                Registreren
                        </Text>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '80%',
                            marginTop: 25
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={fbLogginInLoading}
                            onPress={() => {
                                if (
                                    Email !== '' &&
                                    Email.includes('@')
                                ) {
                                    Alert.alert(
                                        'Reset',
                                        'We hebben een mail naar ' +
                                        Email +
                                        ' verzonden met een link waar je het wachtwoord kunt resetten.',
                                        [
                                            {
                                                text: 'OK',
                                                onPress: () =>
                                                    _sendUserMailToReset()
                                            }
                                        ],
                                        { cancelable: false }
                                    );
                                } else {
                                    Alert.alert(
                                        'Controleer je invoer',
                                        'Vul je email adres correct in bij het email veld',
                                        [
                                            {
                                                text: 'OK'
                                            }
                                        ],
                                        { cancelable: false }
                                    );
                                }
                            }}
                            style={{
                                backgroundColor: 'black',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                padding: 10,
                                marginBottom: 5,
                                borderRadius: 3
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    alignSelf: 'center',
                                    fontWeight: 'bold',
                                    fontSize: 16
                                }}
                            >
                                Wachtwoord vergeten
                        </Text>
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '80%',
                            marginTop: 5
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => logInFB()}
                            style={{
                                backgroundColor: '#4267b2',
                                flexDirection: 'row',
                                padding: 8,
                                borderRadius: 3,
                                marginBottom: 5
                            }}
                            disabled={fbLogginInLoading}
                        >
                            <Grid>
                                <Col
                                    style={{
                                        width: '25%'
                                    }}
                                />
                                <Col
                                    style={{
                                        width: '50%',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: 'white',
                                            alignSelf: 'center',
                                            fontWeight: 'bold',
                                            fontSize: 16
                                        }}
                                    >
                                        Facebook login
                                </Text>
                                </Col>
                                <Col
                                    style={{
                                        width: '25%',
                                        alignItems: 'flex-end'
                                    }}
                                >
                                    <ActivityIndicator
                                        animating={fbLogginInLoading}
                                        size='small'
                                        color='white'
                                    />
                                </Col>
                            </Grid>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        disabled={fbLogginInLoading}
                        style={{ height: 40, width: 287, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => {
                            navigation.navigate('Policy');
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold'
                            }}
                        >
                            Voorwaarden en privacy
                </Text>
                    </TouchableOpacity>
                </Col>
            </Grid>
        </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%',
        height: 70
    },

    headerLogo: {
        resizeMode: 'center'
    },

    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },

    emailInput: {
        height: 40,
        borderColor: 'grey',
        borderWidth: 0,
        width: '80%',
        marginTop: 0,
        padding: 5,
        fontSize: 15
    },

    passWordInput: {
        height: 40,
        borderColor: 'grey',
        borderWidth: 0,
        width: '80%',
        marginTop: 10,
        padding: 5,
        fontSize: 15
    }
});
