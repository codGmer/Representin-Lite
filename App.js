/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as Sentry from 'sentry-expo';
import {
	AppState,
	View,
	ActivityIndicator,
	StyleSheet,
	Platform,
	LogBox
} from 'react-native';
import * as StatusBar from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthCheck from "./navigation/AuthCheck";
import * as SplashScreen from 'expo-splash-screen';
import * as Location from 'expo-location';
import { ScreenProps } from "./context/screenProps";
import { getStatusBarHeight } from 'react-native-status-bar-height';
import ReportError from './api/ReportError';

Sentry.init({
	// dsn: '',
	enableInExpoDevelopment: false,
	debug: true, // Sentry will try to print out useful debugging information if something goes wrong with sending an event. Set this to `false` in production.
});

export default function App() {
	const Stack = createStackNavigator();
	const [userData, setUserData] = useState(null);
	const [introPassed, setIntroPassed] = useState('');
	const [isReady, setIsReady] = useState(false);
	const [filterValue, setFilterValue] = useState(null);
	const [locationPermission, setLocationPermission] = useState(false);
	const [currentScreen, setCurrentScreen] = useState('');
	const [activityFilterValue, setActivityFilterValue] = useState(null);

	const routeNameRef = React.useRef();
	const ready = React.useRef(false);
	const navigationRef = React.useRef();

	const firstRun = useRef(true);

	useLayoutEffect(() => {

		if (Platform.OS === 'android') {
			StatusBar.setStatusBarTranslucent(false)
			StatusBar.setStatusBarBackgroundColor('black');
		}
		StatusBar.setStatusBarStyle('light')

		async function preventHideSplashScreen() {
			try {
				if (!ready.current) {
					await SplashScreen.preventAutoHideAsync();
					ready.current = true;
				}
			} catch (error) {
				console.log(error)
			}
		}

		preventHideSplashScreen();
	}, [])

	useEffect(() => {
		async function _init(localUserData) {
			if (!isReady) {
				let { status } = await Location.requestForegroundPermissionsAsync();
				let error = await AsyncStorage.getItem('error')
				let introPassed = await AsyncStorage.getItem('introPassed')
				_getLocalFilterData();
				setLocationPermission(status === 'granted' ? true : Platform.OS == 'ios' && status !== 'undetermined' ? 'ios' : false);
				if (localUserData === null) {
					setUserData(-1)
				} else {
					setUserData(localUserData);
				}
				if (error !== null) {
					ReportError._reportError(170, JSON.stringify({ error }), false);
				}
				setIntroPassed(introPassed);
			}
		}

		async function _getLocalFilterData() {
			let activityFilterValueLocal = await AsyncStorage.getItem('activityFilterValues')
			let filterValueLocal = await AsyncStorage.getItem('filterValue')
			if (filterValueLocal === null) {
				await AsyncStorage.setItem('filterValue', JSON.stringify(100))
				setFilterValue(100);
			} else {
				setFilterValue(filterValueLocal);
			}
			if (activityFilterValueLocal === null) {
				let obj = {
					locationSelectedIndex: -1,
					intensityselectedIndex: -1,
					familySelectedIndex: -1
				}
				await AsyncStorage.setItem('activityFilterValues', JSON.stringify(obj))
				setActivityFilterValue(obj);
			} else {
				setActivityFilterValue(activityFilterValueLocal);
			}
		}

		async function _getUserData() {
			try {
				let localUserData = await SecureStore.getItemAsync('userData');
				let userData = JSON.parse(localUserData);
				if (userData === 0) {
					userData = null;
				}
				_init(userData)
			} catch (error) {
				_init(null)
			}
		}

		_getUserData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isReady, filterValue, activityFilterValue]);

	useEffect(() => {
		if (filterValue !== null && activityFilterValue !== null && userData !== null) {
			setIsReady(true);
		}
	}, [filterValue, activityFilterValue, userData])

	useEffect(() => {
		let checkLocationForegroundFocus = AppState.addEventListener('change', async (status) => {
			if (status === 'active' && !firstRun.current && locationPermission !== 'ios') {
				let permission = await Location.requestForegroundPermissionsAsync()
				if (permission.granted) {
					let userLocation = await Location.getLastKnownPositionAsync();
					await AsyncStorage.setItem('userLocation', JSON.stringify(userLocation))
				}
			}
			firstRun.current = false;
		})
		return () => checkLocationForegroundFocus;
	}, [])

	let params = { userData, introPassed, filterValue, locationPermission, activityFilterValue };
	if (typeof filterValue === 'undefined' || introPassed == '' || !isReady) {
		return <View style={[styles.horizontal, styles.container]}>
			<ActivityIndicator size="large" color="white" />
		</View>
	} else {
		return (
			<NavigationContainer
				ref={navigationRef}
				onReady={() => routeNameRef.current = navigationRef.current.getCurrentRoute().name}
				onStateChange={() => {
					const previousRouteName = routeNameRef.current;
					const currentRouteName = navigationRef.current.getCurrentRoute().name

					if (previousRouteName !== currentRouteName) {
						setCurrentScreen(currentRouteName);
					}

					// Save the current route name for later comparision
					routeNameRef.current = currentRouteName;
				}}>

				<ScreenProps.Provider value={{ currentScreen }}>
					<View style={{ flex: 1, backgroundColor: 'black' }}>
						<View style={{ flex: 1, marginTop: Platform.OS === 'ios' ? getStatusBarHeight() : 0 }} containerStyle={{ backgroundColor: 'black' }}>
							<Stack.Navigator navigatorStyle={{ screenBackgroundColor: 'green' }}>
								<Stack.Screen
									options={{ header: () => null }}
									initialParams={params}
									name="AuthCheck"
									component={AuthCheck}
								/>
							</Stack.Navigator>
						</View>
					</View>
				</ScreenProps.Provider>
			</NavigationContainer>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'black',
		justifyContent: 'center',
		flex: 1
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	}
});
