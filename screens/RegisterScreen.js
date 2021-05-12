/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
	StyleSheet,
	TextInput,
	View,
	Alert,
	BackHandler,
	Text,
	TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckBox } from 'react-native-elements';
import { Col, Grid } from 'react-native-easy-grid';
import ModalSelector from 'react-native-modal-selector';
import * as Location from 'expo-location';
import { ActivityIndicator } from 'react-native-paper';
import { ExtraProps } from "../context/context";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

// eslint-disable-next-line react/prop-types
export default function RegisterScreen({ navigation }) {
	const [FirstName, setFirstName] = useState("");
	const [LastName, setLastName] = useState("");
	const [Email, setEmail] = useState("");
	const [date, setDate] = useState(new Date());
	const [showDateTimePicker, setShowDateTimePicker] = useState(false);
	const [PassWord, setPassWord] = useState("");
	const [checked, setChecked] = useState(false);
	const [Gender, setGender] = useState('Geslacht');
	const [registerLoading, setRegisterLoading] = useState(false);

	const extraProps = useContext(ExtraProps);

	useEffect(() => {
		BackHandler.addEventListener('hardwareBackPress', _handleBackPress);

		return function cleanUp() {
			BackHandler.removeEventListener(
				'hardwareBackPress',
				_handleBackPress
			);
		}
	}, [])

	function _handleBackPress() {
		navigation.navigate('Login');
		return true;
	}

	async function _askPermission() {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status === 'undetermined') {
			Alert.alert(
				'Locatie',
				'Geef toegang tot je locatie voor deze app. Deze wordt enkel gebruikt binnen de app om jouw aanbod te personaliseren.',
				[
					{
						text: 'OK',
						onPress: () => {
							_askPermission();
						}
					}
				],
				{ cancelable: false }
			);
		} else if (status == 'granted') {
			_getLocationAndNavigate()
		}
	}

	async function _getLocationAndNavigate(responseJson) {
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== 'granted') {
			_askPermission();
		} else if (status == 'granted') {
			await Location.getLastKnownPositionAsync().then(
				async value => {
					if (value == '') {
						AsyncStorage.setItem(
							'userLocation',
							JSON.stringify({
								coords: {
									accuracy: 0,
									altitude: 0,
									heading: 0,
									latitude: 0,
									longitude: 0,
									speed: 0
								}
							})
						).then(async () => {
							if (value !== null) {
								extraProps.userData(responseJson)
								extraProps.onSignIn(true)
							}
						});
					} else {
						AsyncStorage.setItem(
							'userLocation',
							JSON.stringify(value)
						).then(async () => {
							if (value !== null) {
								extraProps.userData(responseJson)
								extraProps.onSignIn(true)
							}
						});
					}
				},
				() => _askPermission()
			);
		}
	}

	function formatDate(date) {
		var d = new Date(date),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();

		if (month.length < 2)
			month = '0' + month;
		if (day.length < 2)
			day = '0' + day;

		return [day, month, year].join('-');
	}

	function _userRegister() {
		setRegisterLoading(true);
		if (
			FirstName !== '' &&
			LastName !== '' &&
			Email !== '' &&
			Gender !== 'Geslacht' &&
			date !== '' &&
			PassWord !== ''
		) {
			if (
				Email.includes('@') &&
				Email.includes(' ') == false &&
				Email.includes(',') == false &&
				Email.includes('.')
			) {
				if (checked == false) {
					Alert.alert('Oops', 'Je moet de voorwaarden accepteren');
					setRegisterLoading(false);
				} else {
					if (
						Email.includes('é') ||
						Email.includes('á') ||
						PassWord.includes('é') ||
						PassWord.includes('á')
					) {
						Alert.alert(
							'Controleer jouw email en wachtwoord op speciale tekens, dit is niet toegestaan'
						);
						setRegisterLoading(false);
					} else {
						if (PassWord.length < 5) {
							Alert.alert(
								'Jouw wachtwoord moet minimaal 5 karakters lang zijn'
							);
							setRegisterLoading(false);
						} else {
							fetch(
								'http://representin.nl/api',
								{
									method: 'POST',
									headers: {
										Accept: 'application/json',
										'Content-Type': 'application/json',
										'Access-Control-Allow-Origin':
											'http://representin.nl/',
										'Access-Control-Allow-Methods': 'POST',
										'Access-Control-Max-Age': '3600',
										'Access-Control-Allow-Headers':
											'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
									},
									body: JSON.stringify({
										action: 'register',
										firstname: FirstName,
										lastname: LastName,
										gender: Gender.toLowerCase(),
										birthdate: formatDate(date),
										email: Email,
										password: PassWord
									})
								}
							)
								.then(response => response.json())
								.then(responseJson => {
									if (
										responseJson !== '404' &&
										responseJson !== '405' &&
										responseJson !== 'AR'
									) {
										SecureStore.setItemAsync(
											'userData',
											JSON.stringify(responseJson)
										).then(() => {
											_getLocationAndNavigate(responseJson);
										});
									} else if (responseJson == '404') {
										Alert.alert(
											'Error',
											'Er is iets fout gegaan: No Request, Probeer het later opnieuw.',
											[
												{
													text: 'OK',
													onPress: () =>
														console.log(
															'OK Pressed'
														)
												}
											],
											{ cancelable: false }
										);
										setRegisterLoading(false);
									} else if (responseJson == '405') {
										Alert.alert(
											'Error',
											'Er is iets fout gegaan: No DB conn, Probeer het later opnieuw.',
											[
												{
													text: 'OK',
													onPress: () =>
														console.log(
															'OK Pressed'
														)
												}
											],
											{ cancelable: false }
										);
										setRegisterLoading(false);
									} else if (responseJson == 'AR') {
										Alert.alert(
											'Helaas',
											'Dit email adres bestaat al',
											[
												{
													text: 'OK',
													onPress: () =>
														console.log(
															'OK Pressed'
														)
												}
											],
											{ cancelable: false }
										);
										setRegisterLoading(false);
									} else {
										Alert.alert(
											'Verkeerde invoer',
											'Vul alle velden in',
											[
												{
													text: 'OK',
													onPress: () =>
														console.log(
															'OK Pressed'
														)
												}
											],
											{ cancelable: false }
										);
										setRegisterLoading(false);
									}
								})
								.catch(error => {
									console.log(error)
									Alert.alert(
										'Niet gelukt',
										'Er ging iets mis bij het registreren, controleer je internetverbinding en probeer het opnieuw. Bij herhaaldelijk voorkomen neem contact op met info@representin.nl',
										[
											{
												text: 'OK',
												onPress: () =>
													console.log('OK Pressed')
											}
										],
										{ cancelable: false }
									);
									setRegisterLoading(false);
								});
						}
					}
				}
			} else {
				Alert.alert(
					'Helaas',
					'Het email adres is niet correct',
					[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
					{ cancelable: false }
				);
				setRegisterLoading(false);
			}
		} else {
			Alert.alert(
				'Helaas',
				'Vul alle velden in',
				[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
				{ cancelable: false }
			);
			setRegisterLoading(false);
		}
	}

	let index = 0;
	const data = [
		{ key: index++, label: 'Man' },
		{ key: index++, label: 'Vrouw' }
	];

	return (
		<React.Fragment>
			{showDateTimePicker == true && (
				<DateTimePicker
					locale="nl-NL"
					value={date}
					is24Hour={true}
					mode='date'
					placeholder='Geboortedatum'
					format='DD-MM-YYYY'
					confirmBtnText='Bevestigen'
					cancelBtnText='Annuleren'
					customStyles={{
						dateIcon: {
							position: 'absolute',
							left: 0,
							top: 4,
							marginLeft: 0
						},
						dateInput: {
							marginLeft: 36,
							fontSize: 16
						}
					}}
					onChange={(event, date) => {
						console.log(date)
						setShowDateTimePicker(false)
						if (event.type !== 'dismissed') {
							setDate(date);
						}
					}}
				/>)}
			< KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps='handled'>
				<Grid>
					<Col style={styles.container}>
						<TextInput
							placeholder='Voornaam'
							textContentType='name'
							style={styles.emailInput}
							onChangeText={FirstName =>
								setFirstName(FirstName)
							}
						/>
						<TextInput
							placeholder='Achternaam'
							textContentType='name'
							style={styles.emailInput}
							onChangeText={LastName =>
								setLastName(LastName)
							}
						/>
						<ModalSelector
							data={data}
							initValue='Onbekend'
							supportedOrientations={['landscape']}
							accessible={true}
							style={{ width: '80%' }}
							scrollViewAccessibilityLabel={'Scrollable options'}
							cancelButtonAccessibilityLabel={'Cancel Button'}
							onChange={option => {
								setGender(option.label);
							}}
						>
							<TextInput
								placeholder='Geslacht'
								textContentType='emailAddress'
								style={{
									marginTop: 8,
									marginBottom: 5,
									marginLeft: 5,
									color: '#A3A3A3',
									fontSize: 15
								}}
								editable={false}
								value={Gender}
							/>
						</ModalSelector>
						<TouchableOpacity
							onPress={() => setShowDateTimePicker(true)}
							style={{ height: 30, width: '80%', marginTop: 10, marginBottom: -6 }}
						>
							<Text style={{ marginLeft: 5, color: '#A3A3A3', fontSize: 15 }}>Geboortedatum</Text>
						</TouchableOpacity>
						<TextInput
							placeholder='Email'
							textContentType='emailAddress'
							style={styles.emailInput}
							onChangeText={Email => setEmail(Email)}
						/>
						<TextInput
							placeholder='Wachtwoord'
							textContentType='password'
							style={styles.passWordInput}
							onChangeText={PassWord => setPassWord(PassWord)}
							secureTextEntry={true}
						/>
						<CheckBox
							center
							style={{ fontSize: 16, marginTop: 20 }}
							containerStyle={{ marginTop: 10 }}
							title='Ik accepteer de voorwaarden'
							checkedIcon='dot-circle-o'
							uncheckedIcon='circle-o'
							checked={checked}
							onPress={() =>
								setChecked(!checked)
							}
						/>
						<View
							style={{
								width: '80%',
								marginTop: 20
							}}
						>
							<TouchableOpacity
								onPress={_userRegister}
								activeOpacity={0.9}
								style={{
									backgroundColor: 'black',
									flexDirection: 'row',
									padding: 10,
									marginBottom: 5,
									borderRadius: 3
								}}
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
											Registreren
                                </Text>
									</Col>
									<Col
										style={{
											width: '25%',
											alignItems: 'flex-end'
										}}
									>
										<ActivityIndicator
											animating={registerLoading}
											size='small'
											color='white'
										/>
									</Col>
								</Grid>
							</TouchableOpacity>
						</View>

						<Text
							onPress={() => {
								navigation.navigate('Policy');
							}}
							style={{
								fontWeight: 'bold'
							}}
						>
							Voorwaarden
				</Text>
					</Col>
				</Grid>
			</KeyboardAwareScrollView>
		</React.Fragment >
	);
}

const styles = StyleSheet.create({
	header: {
		alignItems: 'center',
		backgroundColor: 'black',
		width: '100%',
		height: 70,
		flexDirection: 'row'
	},

	headerLogo: {
		resizeMode: 'center',
		position: 'absolute',
		left: 50
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
		marginTop: 5,
		padding: 5,
		fontSize: 15
	},

	passWordInput: {
		height: 40,
		borderColor: 'grey',
		borderWidth: 0,
		width: '80%',
		marginTop: 5,
		padding: 5,
		fontSize: 16
	}
});
