/* eslint-disable react/prop-types */
import React, { useState, useEffect, useContext } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
	StyleSheet,
	Text,
	View,
	Button,
	ActivityIndicator,
	Alert,
	ScrollView
} from 'react-native';
import { ListItem, Icon } from 'react-native-elements';
import { Row, Grid, Col } from 'react-native-easy-grid';
import { Avatar } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import ReportError from '../api/ReportError';

import { ExtraProps } from "../context/context";
import GetApiListData from '../api/GetApiListData';

const moreFunctionsList = [
	{
		title: 'Partypictures',
		icon: 'camera',
		link: 'Picture'
	}
];

const list = [
	{
		title: 'Favorieten',
		icon: 'favorite',
		link: 'Favorite'
	}
];

const shopList = [
	{
		title: 'Mijn bestellingen',
		icon: 'history',
		link: 'Orders'
	}
];


const aboutList = [
	{
		title: 'Over Representin',
		icon: 'info',
		link: 'About'
	},
	{
		title: 'Algemene voorwaarden',
		icon: 'assignment',
		link: 'Privacy'
	},
	{
		title: 'Contact',
		icon: 'contact-phone',
		link: 'Contact'
	}
];



export default function MoreScreen({ navigation }) {
	const extraProps = useContext(ExtraProps);

	const [userData, setUserData] = useState('');
	const [Loading, setLoading] = useState(true);

	useEffect(() => {

		navigation.addListener('focus', payload => {
			_getUserData();
		});

	}, [])

	async function _logOutUser() {
		try {
			Alert.alert(
				'Bevestiging',
				'Weet je zeker dat je wilt uitloggen?',
				[
					{
						text: 'Ja',
						onPress: async () => {
							await SecureStore.deleteItemAsync('userData').then(() => {
								AsyncStorage.removeItem('Favorites');
								AsyncStorage.removeItem('filterValue');
								AsyncStorage.setItem('introPassed', 'true')
								AsyncStorage.removeItem('userLocation');
								AsyncStorage.removeItem('activityFilterValues');
								extraProps.userData(-1);
								extraProps.loggingIn(true);
								extraProps.onSignIn(false);
								extraProps.signedOutFromApp(true);
							})
						}
					},
					{ text: 'Nee' }
				]
			);
		} catch (error) {
			alert(error + ' loguit error');
		}
	}

	async function _getUserData() {
		try {
			let userdata = await SecureStore.getItemAsync('userData');
			let userData = JSON.parse(userdata);
			if (userData !== null && typeof userData !== 'undefined' && userData !== 'AR' && Object.values(userData).length > 0) {
				let response = await GetApiListData._fetchRequest({
					action: 'getUserDetails',
					userID: userData.UserID
				});
				if (
					response &&
					response !== '' &&
					response !== 'leeg'
				) {
					let remoteUserData = response[0];
					remoteUserData.FbPicture =
						userData.FbPicture;
					setUserData(remoteUserData);
					await SecureStore.setItemAsync('userData', JSON.stringify(remoteUserData));
					setLoading(false);
				} else {
					ReportError._reportError(
						'4998',
						'moreScreen 414 geen userid, userdata: ' +
						response,
						false
					);
					Alert.alert(
						// Shows up the alert without redirecting anywhere
						'Oops',
						'We hebben een fout ontdekt, om dit te verhelpen moet er opnieuw ingelogd worden.',
						[
							{
								text: 'Ok',
								onPress: async () => {
									try {
										await SecureStore.deleteItemAsync('userData').then(async () => {
											AsyncStorage.removeItem('Favorites');
											AsyncStorage.removeItem('filterValue');
											AsyncStorage.setItem('introPassed', 'true')
											AsyncStorage.removeItem('userLocation');
											AsyncStorage.removeItem('activityFilterValues');
											console.log(error + '2000');
											await Updates.fetchUpdateAsync();
											await Updates.reloadAsync()
										})
									} catch (error) {
										console.log(error);
										console.log(error + '2000');
										await SecureStore.deleteItemAsync('userData');
										await Updates.fetchUpdateAsync();
										await Updates.reloadAsync()
									}
								}
							}
						]
					);
				}
			} else {
				ReportError._reportError(
					'5000',
					'moreScreen 425 geen userid gevonden',
					false
				);
				Alert.alert(
					// Shows up the alert without redirecting anywhere
					'Oops',
					'We hebben een fout ontdekt, om dit te verhelpen moet er opnieuw ingelogd worden.',
					[
						{
							text: 'Ok',
							onPress: async () => {
								try {
									await SecureStore.deleteItemAsync('userData').then(async () => {
										AsyncStorage.removeItem('Favorites');
										AsyncStorage.removeItem('filterValue');
										AsyncStorage.setItem('introPassed', 'true')
										AsyncStorage.removeItem('userLocation');
										AsyncStorage.removeItem('activityFilterValues');
										console.log('Error 3000');
										await Updates.fetchUpdateAsync();
										await Updates.reloadAsync()
									})
								} catch (error) {
									console.log(error + '3000');
									await SecureStore.deleteItemAsync('userData');
									await Updates.fetchUpdateAsync();
									await Updates.reloadAsync()
								}
							}
						}
					]
				);
			}
			//() => ReportError._reportError('5050', 'moreScreen 417')
		} catch (error) {
			ReportError._reportError('5060', error);
			Alert.alert(
				'Oops',
				'We hebben een fout ontdekt, om dit te verhelpen moet er opnieuw ingelogd worden.',
				[
					{
						text: 'Ok',
						onPress: async () => {
							try {
								await SecureStore.deleteItemAsync('userData').then(async () => {
									AsyncStorage.removeItem('Favorites');
									AsyncStorage.removeItem('filterValue');
									AsyncStorage.setItem('introPassed', 'true')
									AsyncStorage.removeItem('userLocation');
									AsyncStorage.removeItem('activityFilterValues');
									console.log(error + '4000');
									await Updates.fetchUpdateAsync();
									await Updates.reloadAsync()
								})
							} catch (error) {
								console.log(error);
								console.log(error + '4000');
								await SecureStore.deleteItemAsync('userData');
								await Updates.fetchUpdateAsync();
								await Updates.reloadAsync()
							}
						}
					}
				]
			);
		}
	}

	async function _pickImage() {
		let result = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			aspect: [4, 3]
		});
		if (!result.cancelled) {
			let response = await FileSystem.writeAsStringAsync(result.uri, result.uri);
			AsyncStorage.setItem('userImage', JSON.stringify(response));
			setSelectedImage(response);
		}
	};

	if (!userData || Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="black" />
			</View>
		);
	} else {
		return (
			<React.Fragment>
				<ScrollView>
					<Grid
						style={{
							backgroundColor: '#eff0f3'
						}}
					>
						<Row
							style={{
								height: 180,
								justifyContent: 'center',
								alignSelf: 'center',
								flexDirection: 'column'
							}}
						>
							<Avatar
								source={
									userData.FbPicture
										? {
											uri: userData
												.FbPicture
										}
										: null
								}
								size="xlarge"
								rounded
								editButton={{ size: 30 }}
								onEditPress={() => {
									_pickImage();
								}}
								title={userData?.FirstName?.charAt(
									0
								).toUpperCase()}
							/>
							{userData?.FirstName ? (
								<Text
									style={{
										fontSize: 21,
										textAlign: 'center'
									}}
								>
									{'Hallo ' +
										userData.FirstName}
								</Text>
							) : null}
						</Row>
						<Row style={{ height: 20 }}>
							<Text
								style={{
									fontSize: 15,
									marginLeft: 15
								}}
							>
								Meer
								</Text>
						</Row>
						<Col style={{
							marginTop: 5,
							borderWidth: 1,
							borderRadius: 2,
							borderColor: '#ddd',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.8,
							shadowRadius: 4,
							elevation: 1
						}}>
							{
								moreFunctionsList.map((element, index) => {
									return (
										<ListItem
											subtitle={element.subtitle}
											bottomDivider={true}
											topDivider={true}
											key={index}
											containerStyle={{ height: 50 }}
											onPress={() => navigation.navigate(element.link)}
										>
											<Icon name={element.icon}></Icon>
											<ListItem.Title style={{ flex: 1 }}>{element.title}</ListItem.Title>
											<ListItem.Chevron size={30}></ListItem.Chevron>
										</ListItem>
									)
								})}
						</Col>
						<Row style={{ height: 20, marginTop: 10 }}>
							<Text
								style={{
									fontSize: 15,
									marginLeft: 15
								}}
							>
								Account
								</Text>
						</Row>
						<Col style={{
							marginTop: 5,
							borderWidth: 1,
							borderRadius: 2,
							borderColor: '#ddd',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.8,
							shadowRadius: 4,
							elevation: 1
						}}>
							{
								list.map((element, index) => {
									return (
										<ListItem
											subtitle={element.subtitle}
											bottomDivider={true}
											key={index}
											topDivider={true}
											containerStyle={{ height: 50 }}
											onPress={() => navigation.navigate(element.link)}
										>
											<Icon name={element.icon}></Icon>
											<ListItem.Title style={{ flex: 1 }}>{element.title}</ListItem.Title>
											<ListItem.Chevron size={30}></ListItem.Chevron>
										</ListItem>
									)
								})}
						</Col>
						<Row style={{ height: 20, marginTop: 10 }}>
							<Text
								style={{
									fontSize: 15,
									marginLeft: 15
								}}
							>
								Shop
								</Text>
						</Row>
						<Col style={{
							marginTop: 5,
							borderWidth: 1,
							borderRadius: 2,
							borderColor: '#ddd',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.8,
							shadowRadius: 4,
							elevation: 1
						}}>
							{
								shopList.map((element, index) => {
									return (
										<ListItem
											subtitle={element.subtitle}
											bottomDivider={true}
											topDivider={true}
											key={index}
											containerStyle={{ height: 50 }}
											onPress={() => navigation.navigate(element.link)}
										>
											<Icon name={element.icon}></Icon>
											<ListItem.Title style={{ flex: 1 }}>{element.title}</ListItem.Title>
											<ListItem.Chevron size={30}></ListItem.Chevron>
										</ListItem>
									)
								})}
						</Col>
						<Row style={{ height: 20, marginTop: 15 }}>
							<Text
								style={{
									fontSize: 15,
									marginLeft: 15
								}}
							>
								App
								</Text>
						</Row>
						<Col style={{
							marginTop: 5,
							borderWidth: 1,
							borderRadius: 2,
							borderColor: '#ddd',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.8,
							shadowRadius: 4,
							elevation: 1
						}}>
							{
								aboutList.map((element, index) => {
									return (
										<ListItem
											subtitle={element.subtitle}
											bottomDivider={true}
											topDivider={true}
											containerStyle={{ height: 50 }}
											key={index}
											onPress={() => navigation.navigate(element.link)}
										>
											<Icon name={element.icon}></Icon>
											<ListItem.Title style={{ flex: 1 }}>{element.title}</ListItem.Title>
											<ListItem.Chevron size={30}></ListItem.Chevron>
										</ListItem>
									)
								})}
						</Col>
					</Grid>
					<Button
						title="Uitloggen"
						color="red"
						onPress={_logOutUser}
					/>
				</ScrollView>
			</React.Fragment>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		marginTop: Constants.statusBarHeight,
		justifyContent: 'center'
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	},
	header: {
		alignItems: 'center',
		backgroundColor: 'black',
		width: '100%',
		height: 40,
		flexDirection: 'row',
		justifyContent: 'center'
	},

	headerLogo: {
		resizeMode: 'center'
	}
});
