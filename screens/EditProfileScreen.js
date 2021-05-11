import React, {
	useEffect, useState, useRef, useMemo
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
	StyleSheet,
	Text,
	View,
	ActivityIndicator,
	BackHandler,
	KeyboardAvoidingView,
	TouchableWithoutFeedback,
	Keyboard,
	TouchableOpacity,
	Modal,
	ScrollView
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as ImagePicker from 'expo-image-picker';
import { Card, Avatar, Button, Icon } from 'react-native-elements';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { Image, CacheManager } from "react-native-expo-image-cache";

export default function EditProfileScreen({
	navigation,
	navigation: { setParams }
}) {
	const [loading, setLoading] = useState(true);
	const [userInfo, setUserInfo] = useState([]);
	const [editMode, setEditMode] = useState(false);
	const [initDone, setInitDone] = useState(false);
	const [refreshUserData, setRefreshUserData] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);
	const [refreshImages, setRefreshImages] = useState(false);
	const [test, setTest] = useState(1);
	const [profilePictureModalVisible, setProfilePictureModalVisible] = useState(false);
	const [slideIndex, setSlideIndex] = useState(0);
	const [profileSlideIndex, setProfileSlideIndex] = useState(0);
	const [pictureModalVisible, setPictureModalVisible] = useState(0);
	const isFirstRun = useRef(true);
	const [profilePictures, setProfilePictures] = useState([]);
	const [profilePicturesSlider, setProfilePicturesSlider] = useState([]);
	const [profilePictureLength, setProfilePictureLength] = useState(0);

	function _toggleEditMode() {
		if (editMode) {
			setEditMode(false);
			setParams({ toggleEditMode2: false });
		} else if (!editMode) {
			setEditMode(true);
			setParams({ toggleEditMode2: true });
		}
	}

	function _saveUserData() {
		SecureStore.getItemAsync('userData').then(data => {
			let userData = JSON.parse(data);
			fetch('http://representin.nl/newapp/functions/index.php', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'http://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				},
				body: JSON.stringify({
					action: 'saveUserDetails',
					userID: userData.UserID,
					firstName: userInfo.FirstName,
					lastName: userInfo.LastName
				})
			})
				.then(response => response.json())
				.then(responseJson => {
					if (responseJson === '1') {
						_toggleEditMode();
						setRefreshUserData(true);
					} else {
						alert('Niet gelukt!');
					}
				});
		});
	};

	async function _pickImage(picture) {
		let result = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			aspect: [4, 3],
			mediaTypes: 'Images',
			quality: 0.7
		});
		if (!result.cancelled) {
			if (result.type === 'image') {
				//if (result.height < 900 && result.width < 900) {
				setSelectedImage(result);
				_uploadImage(picture, result.uri);
				// } else {
				// 	alert('Image te groot');
				// 	console.log('Image too large');
				// }
			} else {
				alert('Upload een geldige image');
				console.log('No image found');
			}
		}
	};

	function RenderPicture() {
		setRefreshImages(false);
		let index = 0;
		return profilePictures.map((picture, index) => {
			index++;
			const preview = { uri: 'https://representin.nl/newapp/pfpictures/' + userInfo.ProfileId + '/' + profilePictures[picture.PictureID - 1].PfPictureUri + '?time=' + Date.now() };
			let uri = 'https://representin.nl/newapp/pfpictures/' + userInfo.ProfileId + '/' + profilePictures[picture.PictureID - 1].PfPictureUri + '?time=' + Date.now()

			return useMemo(() => <TouchableOpacity disabled={picture.PfPictureUri == 'null' && profilePictureLength !== picture.PictureID} onPress={picture.PfPictureUri == 'null' ? () => { _pickImage(picture.PictureID) } : () => { setSlideIndex(picture.PictureID - 1); setPictureModalVisible(true) }}>
				<View style={{ width: 100, margin: 3.5, borderRadius: 10, justifyContent: 'center', backgroundColor: '#ddd', height: 100 }}>
					{picture.PfPictureUri !== 'null' ?
						<React.Fragment>
							<Image style={{ width: 100, height: 100, borderRadius: 10 }}{...{ preview, uri }}></Image >
							<Icon onPress={() => _removePicture(picture.PictureID)} size={20} iconStyle={{ color: 'white', }} containerStyle={{ position: 'absolute', top: 0, alignSelf: 'flex-end' }} type={'entypo'} name={'cross'}></Icon>
						</React.Fragment>
						:
						profilePictureLength == picture.PictureID && picture.PfPictureUri == 'null' ?
							<Text style={{ textAlign: 'center', fontSize: 20 }}>+</Text>
							: <Icon name={'image'}></Icon>
					}
				</View>
			</TouchableOpacity>, [refreshImages === true])
		})
	}

	useEffect(() => {
		let _isMounted = true;
		function _init() {
			if (_isMounted && !initDone) {
				setParams({
					toggleEditMode: _toggleEditMode,
					toggleEditMode2: false
				});
				navigation.addListener('focus', playload => {
					_getUserData();
					BackHandler.addEventListener(
						'hardwareBackPress',
						handleBackPress
					);
				});
				setInitDone(true);
			} else if (refreshUserData) {
				_getProfilePictures(userInfo.ProfileId);
			}
		}

		function _getUserData() {
			SecureStore.getItemAsync('userData').then(data => {
				let userData = JSON.parse(data);
				fetch('http://representin.nl/newapp/functions/index.php', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json;charset=utf-8',
						'Access-Control-Allow-Origin': 'http://representin.nl/',
						'Access-Control-Allow-Methods': 'POST',
						'Access-Control-Max-Age': '3600',
						'Access-Control-Allow-Headers':
							'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
					},
					body: JSON.stringify({
						action: 'getUserDetails',
						userID: userData.UserID
					})
				})
					.then(response => response.json())
					.then(responseJson => {
						if (responseJson) {
							let remoteUserData = responseJson[0];
							remoteUserData.FbPicture = userData.FbPicture;
							setUserInfo(remoteUserData);
							setRefreshUserData(false);
							_getProfilePictures(remoteUserData.ProfileId);
						}
					})
					.catch(error => {
						console.log(error);
					});
			});
		}

		function _getProfilePictures(profileID) {
			setRefreshUserData(false)
			fetch('http://representin.nl/newapp/functions/index.php', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'http://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				},
				body: JSON.stringify({
					action: 'getProfilePictures',
					profileID: profileID
				})
			})
				.then(response => response.json())
				.then(responseJson => {
					if (responseJson) {
						let obj;
						let sliderObj;
						if (responseJson !== 'leeg') {
							setProfilePictureLength(responseJson.length + 1)
							obj = [responseJson[0] ? responseJson[0] : { PfPictureUri: 'null', PictureID: 1 }, responseJson[1] ? responseJson[1] : { PfPictureUri: 'null', PictureID: 2 }, responseJson[2] ? responseJson[2] : { PfPictureUri: 'null', PictureID: 3 }, responseJson[3] ? responseJson[3] : { PfPictureUri: 'null', PictureID: 4 }, responseJson[4] ? responseJson[4] : { PfPictureUri: 'null', PictureID: 5 }, responseJson[5] ? responseJson[5] : { PfPictureUri: 'null', PictureID: 6 }]
							sliderObj = [responseJson[0] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[0].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }, responseJson[1] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[1].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }, responseJson[2] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[2].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }, responseJson[3] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[3].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }, responseJson[4] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[4].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }, responseJson[5] ? { url: 'http://representin.nl/newapp/pfpictures/' + profileID + '/' + responseJson[5].PfPictureUri + '?time=' + Date.now() } : { url: 'null' }]
						} else {
							setProfilePictureLength(1)
							obj = [{ PfPictureUri: 'null', PictureID: 1 }, { PfPictureUri: 'null', PictureID: 2 }, { PfPictureUri: 'null', PictureID: 3 }, { PfPictureUri: 'null', PictureID: 4 }, { PfPictureUri: 'null', PictureID: 5 }, { PfPictureUri: 'null', PictureID: 6 }]
							sliderObj = [{ url: 'null' }, { url: 'null' }, { url: 'null' }, { url: 'null' }, { url: 'null' }, { url: 'null' }]
						}
						if (profilePicturesSlider !== sliderObj) {
							setProfilePicturesSlider(sliderObj);
						}
						if (profilePictures !== obj) {
							setProfilePictures(obj);
						}
						console.log(profilePictures)
					}
				})
				.catch(error => {
					console.log(error);
				});
		}

		_init();
		return function cleanUp() {
			BackHandler.removeEventListener(
				'hardwareBackPress',
				handleBackPress
			);
			_isMounted = false;
		};
	}, [refreshUserData == true, editMode]);

	useEffect(() => {
		if (isFirstRun.current) {
			isFirstRun.current = false;
			return;
		} else if (loading) {
			setLoading(false);
		}

	}, [profilePictures])

	function _uploadImage(pictureIndex, pickedPicture) {
		var data = new FormData();
		data.append('action', 'uploadProfileImage');
		data.append('profileID', userInfo.ProfileId);
		data.append('pictureIndex', pictureIndex)
		data.append('file', {
			uri: pickedPicture,
			type: 'image/jpg',
			name: 'tempimage.jpg'
		});
		console.log(pictureIndex)
		fetch('http://representin.nl/newapp/functions/index.php', {
			method: 'POST',
			body: data,
			headers: {
				Accept: 'application/json'
			}
		})
			.then(response => response.json())
			.then(responseJson => {
				if (responseJson[0].Result == 1) {
					setRefreshUserData(true)
				} else {
					//alert('Niet gelukt, probeer het later opnieuw')
				}
			});
	};

	function _removePicture(pictureID) {
		fetch('http://representin.nl/newapp/functions/index.php', {
			method: 'POST',
			body: JSON.stringify({
				action: 'deleteProfileImage',
				pictureIndex: pictureID,
				profileID: userInfo.ProfileId,
			}),
			headers: {
				Accept: 'application/json'
			}
		})
			.then(response => response.json())
			.then(responseJson => {
				if (responseJson[0].Result == 1) {
					setRefreshUserData(true)
					setTest(pictureID);
				} else {
					//alert('Niet gelukt, probeer het later opnieuw')
				}
			});
	}

	function handleBackPress() {
		navigation.goBack();
		return true;
	};

	return loading ? (
		<View style={[styles.horizontal, styles.container]}>
			<ActivityIndicator size="large" color="black" />
		</View>
	) : (
			<KeyboardAvoidingView
				style={{
					flex: 1,
					flexDirection: 'column'
				}}
				behavior="padding"
				enabled
				keyboardVerticalOffset={150}
			>
				<ScrollView>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View
							style={{
								flex: 1
							}}
						>
							<Card
								containerStyle={{
									padding: 0,
									marginTop: 30,
									marginRight: 0,
									marginLeft: 0,
									alignItems: 'center'
								}}
							>
								<Avatar
									onPress={() => setProfilePictureModalVisible(true)}
									source={{ uri: 'https://representin.nl/newapp/pfpictures/' + userInfo.ProfileId + '/' + userInfo.ProfileId + '_main.jpg?time=' + Date.now() }}
									size="xlarge"
									rounded
									showEditButton={true}
									editButton={{ size: 30 }}
									onEditPress={() => {
										_pickImage('main');
									}}
									title={'n'}
								/>
								<Text>
									{userInfo.FirstName + ' ' + userInfo.LastName}
								</Text>
								<Text>
									{userInfo.BirthDate + ' Jaar, ' + userInfo.City}
								</Text>
							</Card>

							<Card
								containerStyle={{
									padding: 0,
									marginTop: 30,
									marginRight: 0,
									marginLeft: 0,
									alignItems: 'center'
								}}
							>
								{<View style={{
									flexDirection: 'row', flexWrap: 'wrap',
									justifyContent: 'center'
								}}>
									<RenderPicture />
								</View>}
							</Card>
							<Modal
								visible={profilePictureModalVisible}
								transparent={false}
								onRequestClose={() =>
									setProfilePictureModalVisible(false)
								}
							><View
								style={{
									position: 'absolute',
									zIndex: 1,
									left: 15,
									top: 35,
									height: 40,
									width: '100%',
									flexDirection: 'row'
								}}
							>
									<TouchableOpacity
										onPress={() => {
											setProfilePictureModalVisible(false)
										}}
										style={{
											height: 40
										}}
									>
										<Icon
											name={'arrow-back'}
											size={24}
											color={'white'}
										/>
									</TouchableOpacity>

								</View>
								<ImageViewer
									index={slideIndex}
									imageUrls={[{ url: 'https://representin.nl/newapp/pfpictures/' + userInfo.ProfileId + '/' + userInfo.ProfileId + '_main.jpg?time=' + Date.now() }]}
									enableSwipeDown={true}
									onSwipeDown={() =>
										setProfilePictureModalVisible(false)
									}
									onChange={index => {
										setProfileSlideIndex(index)
									}}
									onSave={() => { }}
									menuContext={{
										saveToLocal: 'Opslaan',
										cancel: 'Annuleren'
									}}
								/></Modal>
							<Modal
								visible={pictureModalVisible}
								transparent={false}
								onRequestClose={() =>
									setPictureModalVisible(false)
								}
							>
								<View
									style={{
										position: 'absolute',
										zIndex: 1,
										left: 15,
										top: 35,
										height: 40,
										width: '100%',
										flexDirection: 'row'
									}}
								>
									<TouchableOpacity
										onPress={() => {
											setPictureModalVisible(false)
										}}
										style={{
											height: 40
										}}
									>
										<Icon
											name={'arrow-back'}
											size={24}
											color={'white'}
										/>
									</TouchableOpacity>

								</View>
								<ImageViewer
									index={slideIndex}
									imageUrls={profilePicturesSlider}
									enableSwipeDown={true}
									onSwipeDown={() =>
										setPictureModalVisible(false)
									}
									onChange={index => {
										setSlideIndex(index)
									}}
									onSave={() => { }}
									menuContext={{
										saveToLocal: 'Opslaan',
										cancel: 'Annuleren'
									}}
								/>
							</Modal>
							<View
								style={{
									flexDirection: 'row',
									marginTop: 10,
									paddingRight: 10,
									paddingLeft: 10
								}}
							>
								<Button
									title="+ Connect"
									containerStyle={{ width: '50%' }}
								></Button>
								<Text style={{ flex: 1, textAlign: 'right' }}>
									100+ Connects
						</Text>
							</View>
							{/* <Text
							style={{
								color: 'grey',
								marginBottom: 10
							}}
						>
							Voornaam
					</Text> */}
							{/* {editMode ? (
							<TextInput
								style={{
									borderWidth: 1,
									paddingLeft: 10,
									paddingRight: 10,
									paddingTop: 5,
									paddingBottom: 5,
									fontSize: 18,
									fontWeight: 'bold',
									borderColor: '#cccccc',
									borderRadius: 3,
									width: '68%',
									marginBottom: 10
								}}
								value={userInfo.FirstName}
								onChangeText={async FirstName => {
									setUserInfo(prevState => {
										let replaceArr = Object.assign(
											{},
											prevState
										);

										replaceArr.FirstName = FirstName;
										return replaceArr;
									});
								}}
							/>
						) : null}
						{!editMode ? (
							<Text
								style={{
									fontSize: 18,
									fontWeight: 'bold'
								}}
							>
								{userInfo.FirstName}
							</Text>
						) : null}
						<Text
							style={{
								color: 'grey',
								marginTop: 10,
								marginBottom: 10
							}}
						>
							Achternaam
					</Text>
						{editMode ? (
							<TextInput
								style={{
									borderWidth: 1,
									paddingLeft: 10,
									paddingRight: 10,
									paddingTop: 5,
									paddingBottom: 5,
									fontSize: 18,
									fontWeight: 'bold',
									borderColor: '#cccccc',
									borderRadius: 3,
									width: '68%'
								}}
								value={userInfo.LastName}
								onChangeText={async LastName => {
									setUserInfo(prevState => {
										let replaceArr = Object.assign(
											{},
											prevState
										);
										replaceArr.LastName = LastName;
										return replaceArr;
									});
								}}
							/>
						) : null}
						{!editMode ? (
							<Text
								style={{
									fontSize: 18,
									fontWeight: 'bold'
								}}
							>
								{userInfo.LastName}
							</Text>
						) : null}
						<Text
							style={{
								fontSize: 15,
								marginTop: 10,
								marginBottom: 10,
								color: 'grey'
							}}
						>
							Emailadres
					</Text>
						<Text
							style={{
								fontSize: 18,
								fontWeight: 'bold'
							}}
						>
							{userInfo.Email}
						</Text>
						{userInfo.BirthDate ? (
							<Text
								style={{
									fontSize: 15,
									marginTop: 10,
									marginBottom: 10,
									color: 'grey'
								}}
							>
								Geboortedatum
						</Text>
						) : null}
						{userInfo.BirthDate ? (
							<Text
								style={{
									fontSize: 18,
									fontWeight: 'bold'
								}}
							>
								{userInfo.BirthDate}
							</Text>
						) : null}

						{editMode ? (
							<Button
								buttonStyle={{
									marginTop: 20,
									marginRight: 20,
									width: '40%',
									alignSelf: 'flex-end',
									backgroundColor: 'rgb(255, 187, 0)'
								}}
								title="Opslaan"
								onPress={() => this._saveUserData()}
							/>
						) : null} */}
						</View>
					</TouchableWithoutFeedback>
				</ScrollView>
			</KeyboardAvoidingView >
		);
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},

	header: {
		alignItems: 'center',
		backgroundColor: 'black',
		width: '100%',
		height: 59,
		flexDirection: 'row'
	},

	inner: {
		padding: 15,
		flex: 1,
		justifyContent: 'flex-end'
	},

	headerLogo: {
		resizeMode: 'center'
	},

	input: {
		fontSize: 20,
		fontWeight: 'bold',
		borderWidth: 1,
		padding: 5,
		color: 'black'
	},

	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	}
});
