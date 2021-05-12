/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
    Alert,
    View,
    ActivityIndicator,
    Text,
    Platform,
    BackHandler,
    StyleSheet
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Icon, Button } from 'react-native-elements';
import ReportError from '../api/ReportError';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import ResetScreen from '../screens/ResetScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PolicyScreen from '../screens/PrivacyScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { ExtraProps } from "../context/context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import AppIntroSliderScreen from './AppIntroSlider'
import * as SplashScreen from 'expo-splash-screen';
import MainHeader from '../constants/MainHeader';

import AppLink from 'react-native-app-link';

const Stack = createStackNavigator();

export default function AuthCheck({ route, navigation }) {
    const [userData, setUserData] = useState(route.params.userData);
    const [introPassed, setIntroPassed] = useState(route.params.introPassed == null ? !route.params.locationPermission ? false : true : route.params.introPassed);
    const [initFilterValue] = useState(route.params.filterValue);
    const [initFilterParams] = useState(route.params.activityFilterValue);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(route.params.locationPermission == null ? false : route.params.locationPermission);
    const [loggingIn, setLoggingIn] = useState(false);
    const [signedOut, setSignedOut] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [updateChecked, setUpdateChecked] = useState(false);
    const [count, setCount] = useState(-1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function _checkForOtaUpdate() {
            try {
                if (Constants.appOwnership !== 'expo') {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        await Updates.fetchUpdateAsync();
                        // ... notify user of update ...
                        await Updates.reloadAsync()
                    } else {
                        _checkForAppUpdate();
                    }
                } else {
                    _checkForAppUpdate();
                }
            } catch (e) {
                if (Constants.appOwnership !== 'expo') {
                    console.log(e);
                }
            }
        }

        async function _checkForAppUpdate() {
            if (Platform.OS == 'ios') {
                if (
                    Constants.nativeAppVersion !== '2.7.0' &&
                    Constants.appOwnership !== 'expo'
                ) {
                    setUpdateAvailable(true);
                    setUpdateChecked(true)
                } else {
                    console.log('about to get location and navigate')
                    setUpdateChecked(true);
                }
            } else {
                if (
                    Constants.nativeAppVersion !== '2.7.0' &&
                    Constants.appOwnership !== 'expo'
                ) {
                    setUpdateAvailable(true);
                    setUpdateChecked(true)
                    console.log('update available!')
                } else {
                    if (Platform.Version > 22) {
                        setUpdateChecked(true)
                    } else {
                        ReportError._reportError(
                            -1,
                            'Verouderde Android versie ' + Platform.Version,
                            false
                        );
                        Alert.alert(
                            'Verouderde Android',
                            'Uw Android versie is verouderd, update uw Android versie om de Representin app te kunnen gebruiken. De laatste ondersteunde versie is Android 6.0 "Marshmallow", neem contact met ons op als dit bericht blijft verschijnen',
                            [
                                {
                                    text: 'Ok',
                                    onPress: () => BackHandler.exitApp()
                                }
                            ],
                            { cancelable: false }
                        );
                    }
                }
            }
        }

        _checkForOtaUpdate();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        async function _getLocationAndNavigate(data) {
            if (locationPermissionGranted === true) {
                if (data !== -1 && introPassed) {
                    try {
                        let userLocation = await Location.getCurrentPositionAsync({
                            accuracy:
                                !Constants.isDevice && Platform.OS === 'android'
                                    ? 3
                                    : Location.Accuracy.Balanced
                        });
                        await AsyncStorage.setItem('userLocation', JSON.stringify(userLocation), async () => {
                            if (typeof userLocation !== 'undefined' && Object.values(userLocation).length > 0) {
                                if (userData == -1) {
                                    setLoggingIn(true);
                                    setLoggedIn(false);
                                    setSignedOut(true);
                                    console.log('UserData null Authcheck')
                                } else {
                                    setLoggingIn(false);
                                    setLoggedIn(true);
                                    setSignedOut(false);
                                }
                                setLoading(false);
                            } else {
                                console.log('userLocation is undefined, settings userData to null... AuthCheck.js')
                                setUserData(null);
                            }
                        })
                    } catch (error) {
                        console.log(error)
                        ReportError._reportError(
                            1,
                            error,
                            false
                        );
                        Alert.alert('Er ging iets mis met de locatie ophalen, probeer het opnieuw')
                        setLoggingIn(false);
                        setLoggedIn(false);
                        setSignedOut(true);
                    }
                } else if (data === -1 && !introPassed && !locationPermissionGranted) {
                    setIntroPassed(false);
                } else {
                    setLoggingIn(true);
                    setLoggedIn(false);
                    setSignedOut(true);
                    setLoading(false);
                }
            } else if (locationPermissionGranted == 'ios' && userData == -1) {
                setIntroPassed(true)
                setLoggingIn(true);
                setLoggedIn(false);
                setSignedOut(false);
            } else if (locationPermissionGranted == 'ios' && userData !== -1) {
                setIntroPassed(true)
                setLoggingIn(false);
                setLoggedIn(true);
                setSignedOut(false);
            } else {
                if (userData !== -1) {
                    setIntroPassed(true)
                    _checkLocationPermission();
                } else {
                    setIntroPassed(false);
                    setLoggingIn(false);
                    setLoggedIn(false);
                    setLocationPermissionGranted(false);
                }
            }
        }

        async function _askLocationPermission() {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationPermissionGranted(true);
            }
            return status;
        }

        async function _checkLocationPermission() {
            const AsyncAlert = () => new Promise((resolve) => {
                Alert.alert(
                    'Locatie',
                    'Je moet toegang tot je locatie geven voor deze app. Deze wordt enkel gebruikt binnen de app.',
                    [
                        {

                            text: 'OK',
                            onPress: async () => {
                                resolve(await _askLocationPermission());
                            }
                        },
                    ],
                    { cancelable: false },
                );
            });
            let status = await AsyncAlert();
            if (status !== 'granted' && status !== 'undetermined') {
                if (Platform.OS === 'android') {
                    _checkLocationPermission();
                } else {
                    setLocationPermissionGranted('ios');
                }
            }
        }

        if (updateChecked) {
            _getLocationAndNavigate(userData);
        }
    }, [updateChecked, loggedIn, userData, locationPermissionGranted])

    useEffect(() => {
        async function _hideSplash() {
            if (!loading) {
                try {
                    setTimeout(async () => {
                        await SplashScreen.hideAsync()
                    }, 200)
                } catch (error) {
                    console.log(error)
                }
            }
        }
        _hideSplash()
    }, [loading])

    function GetCurrentLocation() {
        return <View style={[styles.horizontal, styles.container]}>
            <ActivityIndicator size="large" color="white" />
        </View>
    }

    function UpdateAvailable() {
        return (
            <View
                style={[
                    styles.horizontal,
                    styles.container,
                    {
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                ]}
            >
                <Icon
                    size={200}
                    name={'system-update'}
                    color={'white'}
                    style={{ marginBottom: 20 }}
                />
                <Text
                    style={{
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 17,
                        marginTop: 40
                    }}
                >
                    {'Nieuwe app versie beschikbaar!'}
                </Text>
                <Text
                    style={{
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 17,
                        marginBottom: 10,
                        marginTop: 30
                    }}
                >
                    {
                        'De Representin app moet geüpdate worden om deze te kunnen gebruiken.'
                    }
                </Text>
                <Button
                    title="Update de app"
                    buttonStyle={{
                        marginTop: 20,
                        backgroundColor: 'rgb(255,187,0)'
                    }}
                    containerStyle={{ width: '40%' }}
                    titleStyle={{ color: 'black' }}
                    onPress={() =>
                        AppLink.openInStore({
                            appName: 'representin APP',
                            appStoreId: 1467879477,
                            appStoreLocale: 'nl',
                            playStoreId: 'com.representin.representin'
                        })
                            .then(() => { })
                            .catch(err => {
                                console.log(err);
                            })
                    }
                />
            </View>
        );
    }

    return (
        <ExtraProps.Provider value={{ userData: setUserData, onSignIn: setLoggedIn, signedOutFromApp: setSignedOut, introPassed: setIntroPassed, locationPermission: setLocationPermissionGranted, loggingIn: setLoggingIn }}>
            <Stack.Navigator screenOptions={{ headerShown: true, headerBackTitleVisible: false, headerTintColor: 'white' }}>
                {updateAvailable ? (
                    <Stack.Screen name="Update" component={UpdateAvailable} />
                ) : ((introPassed && !loggedIn && signedOut && locationPermissionGranted && !loading) || (loggingIn || userData == -1)) ? (
                    <>
                        <Stack.Screen name="Login" options={MainHeader({ navigationParam: navigation, backButton: false })} component={LoginScreen} />
                        <Stack.Screen name="Register" options={MainHeader({ navigationParam: navigation, backButton: true })} component={RegisterScreen} />
                        <Stack.Screen name="Policy" options={MainHeader({ navigationParam: navigation, backButton: true })} component={PolicyScreen} />
                        <Stack.Screen name="Reset" options={MainHeader({ navigationParam: navigation, backButton: true })} component={ResetScreen} />
                    </>
                ) : !introPassed && !locationPermissionGranted && !loggingIn ? (
                    <Stack.Screen
                        name="AppIntroSliderScreen"
                        options={{ header: () => null }}
                        component={AppIntroSliderScreen}
                    />
                ) : (loggedIn && !loggingIn && userData !== -1 && userData !== null && locationPermissionGranted) ? (
                    <Stack.Screen
                        name="App"
                        initialParams={{
                            countParam: count,
                            profileIDParam: userData.ProfileID,
                            initFilterValue,
                            initFilterParams
                        }}
                        options={{
                            header: () => {
                                return null;
                            }
                        }}
                        component={BottomTabNavigator}
                    />
                ) :
                    <Stack.Screen
                        name="GetCurrentLocation"
                        options={{ header: () => null }}
                        component={GetCurrentLocation}
                    />
                }
            </Stack.Navigator>
        </ExtraProps.Provider>
    );

}
const styles = StyleSheet.create({
    div: {
        fontSize: 17
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
        color: 'rgb(255, 187, 0)',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 1
    },

    header: {
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%',
        height: 59,
        flexDirection: 'row'
    },

    headerLogo: {
        resizeMode: 'center'
    },

    horizontal: {
        justifyContent: 'center',
        padding: 10
    }
});
