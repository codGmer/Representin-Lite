/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
	StyleSheet,
	View,
	Alert,
	TextInput,
	Text
} from 'react-native';
import { Button } from 'react-native-elements';

export default function ResetScreen({ route, navigation }) {

	const [passWord, setPassWord] = useState("");
	const [passWordComfirm, setPassWordComfirm] = useState("");

	function _userResetPassWord() {
		if (
			passWord === passWordComfirm &&
			passWord !== '' &&
			passWordComfirm !== ''
		) {
			if (
				passWord.includes('é') ||
				passWord.includes('á') ||
				passWord.includes('é') ||
				passWord.includes('á')
			) {
				// eslint-disable-next-line no-undef
				alert(
					'Controleer jouw wachtwoord op speciale tekens, dit is niet toegestaan!'
				);
			} else {
				if (passWord.length < 5) {
					// eslint-disable-next-line no-undef
					alert(
						'Jouw wachtwoord moet minimaal 5 karakters lang zijn!'
					);
				} else {
					// eslint-disable-next-line no-undef
					fetch('http://representin.nl/api', {
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
							action: 'userResetPassWord',
							key: route.params.key,
							newPassWord: passWord
						})
					})
						.then(response => response.json())
						.then(responseJson => {
							if (responseJson !== '' && responseJson !== '0') {
								Alert.alert(
									'Gelukt',
									'Vanaf nu kun je inloggen met jouw nieuwe wachtwoord',
									[
										{
											text: 'OK',
											onPress: () =>
												navigation.goBack()
										}
									],
									{ cancelable: false }
								);
							} else if (responseJson == '404') {
								Alert.alert(
									'Error',
									'Er is iets fout gegaan: No Request, Probeer het later opnieuw.',
									[
										{
											text: 'OK',
											onPress: () =>
												console.log('OK Pressed')
										}
									],
									{ cancelable: false }
								);
							} else if (responseJson == '405') {
								Alert.alert(
									'Error',
									'Er is iets fout gegaan: Geen verbinding mogelijk met Representin, Probeer het later opnieuw.',
									[
										{
											text: 'OK',
											onPress: () =>
												console.log('OK Pressed')
										}
									],
									{ cancelable: false }
								);
							} else {
								Alert.alert(
									'Mislukt',
									'Controleer je email en wachtwoord!',
									[
										{
											text: 'OK',
											onPress: () =>
												console.log('OK Pressed')
										}
									],
									{ cancelable: false }
								);
							}
						})
						.catch(() => {
							// eslint-disable-next-line no-undef
							alert(
								'Er ging iets mis met het resetten van je wachtwoord, controleer de reset link in de email of neem contact op met info@representin.nl'
							);
						});
				}
			}
		} else {
			Alert.alert(
				'Mislukt',
				'De wachtwoorden komen niet overeen, controleer de invoer!',
				[{ text: 'OK', onPress: () => console.log('OK Pressed') }],
				{ cancelable: false }
			);
		}
	}

	return (
		<View style={styles.container}>
			<Text>Vul je nieuwe wachtwoord in:</Text>
			<TextInput
				placeholder='Wachtwoord'
				textContentType='password'
				containerStyle={{ width: '80%' }}
				style={styles.passWordInput}
				onChangeText={passWord =>
					setPassWord(passWord)
				}
				secureTextEntry={true}
			/>
			<TextInput
				placeholder='Wachtwoord bevestigen'
				textContentType='password'
				containerStyle={{ width: '80%' }}
				style={styles.passWordInput}
				onChangeText={passWord =>
					setPassWordComfirm(passWord)
				}
				secureTextEntry={true}
			/>
			<Button
				title='Bevestigen'
				buttonStyle={{ backgroundColor: 'black', marginTop: 5 }}
				containerStyle={{
					width: '80%',
					margin: 5,
					marginTop: 5
				}}
				style={{ marginTop: 5 }}
				onPress={_userResetPassWord}
			/>
		</View>
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
		justifyContent: 'center',
		alignItems: 'center',
		//alignSelf: 'center',
		height: '100%',
		width: '100%',
		marginBottom: 20
	},

	emailInput: {
		height: 40,
		borderColor: 'grey',
		borderWidth: 0,
		width: '80%',
		marginTop: 0,
		padding: 5
	},

	passWordInput: {
		height: 40,
		borderColor: 'grey',
		borderWidth: 0,
		width: '80%',
		marginTop: 10,
		padding: 5
	}
});
