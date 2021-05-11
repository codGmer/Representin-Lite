import React, { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import NetInfo from "@react-native-community/netinfo";
import {
	StyleSheet,
	View,
	Image,
	Text,
	ActivityIndicator,
	BackHandler,
	Dimensions,
	Linking,
	TextInput,
	Alert,
	Platform,
	TouchableWithoutFeedback,
	Keyboard
} from 'react-native';
import { Icon, Button } from 'react-native-elements';
import ErrorMessage from '../components/ErrorMessage';
import EditIcon from 'react-native-vector-icons/MaterialIcons';
import { Row, Grid } from 'react-native-easy-grid';

import GetApiData from '../api/GetApiListData';
import Modal from 'react-native-modal';
import { TouchableOpacity } from 'react-native-gesture-handler';
import ReportError from '../api/ReportError';
import ActionResultAlert from '../components/ActionResultAlert';
import DeleteIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export default function PaymentOverViewScreen({ navigation, route }) {

	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [fillAdressModalVisible, setFillAdressModalVisible] = useState(false);
	const [fillbillingAddressModalVisible, setFillbillingAddressModalVisible] = useState(false);
	const [fillNameModalVisible, setFillNameModalVisible] = useState(false);
	const [tempUserAddressData, setTempUserAddressData] = useState("");
	const [tempUserBillingAddressData, setTempUserBillingAddressData] = useState("");
	const [tempFirstName, setTempFirstName] = useState("");
	const [tempLastName, setTempLastName] = useState("");
	const [tempEmail, setTempEmail] = useState("");
	const [userFormData, setUserFormData] = useState("");
	const [paymentDone, setPaymentDone] = useState(false);
	const [userBillingFormData, setUserBillingFormData] = useState("");
	const [saveAddressButton, setSaveAddressButton] = useState(true);
	const [saveBillingAddressButton, setSaveBillingAddressButton] = useState(true);
	const [getAddressInfoTimeOut, setGetAddressInfoTimeOut] = useState(false);
	const [getBillingAddressInfoTimeOut, setGetBillingAddressInfoTimeOut] = useState(false);
	const [addressPostCodeInput, setAddressPostCodeInput] = useState("");
	const [addressHouseNumberInput, setAddressHouseNumberInput] = useState("");
	const [modalPaymentFailedVisible, setModalPaymentFailedVisible] = useState(false);
	const [emailExistsVisible, setEmailExistsVisible] = useState(false);
	const [discountCodeInput, setDiscountCodeInput] = useState("");
	const [discountCodeFailed, setDiscountCodeFailed] = useState(false);
	const [applyDiscountCodeBtnDisabled, setApplyDiscountCodeBtnDisabled] = useState(false);
	const [status, setStatus] = useState("");
	const [discountStatusText, setDiscountStatusText] = useState('Geen geldige code');
	const [refreshing, setRefreshing] = useState(false);
	const [isOffline, setIsOffline] = useState(false);
	const [emailExists, setEmailExists] = useState(false);
	const [emailIncorrect, setEmailIncorrect] = useState(false);
	const [fillNameModalHidden, setFillNameModalHidden] = useState(true);

	const isFirstRun = useRef(true);

	useEffect(() => {

		async function init() {
			if (isFirstRun.current) {
				_getConnectionInfo();
				isFirstRun.current = false;
				return;
			} else if (refreshing) {
				_getOrderData();
				_getUserData();
			}
		}

		async function _getConnectionInfo() {
			NetInfo.fetch().then(state => {
				if (!state.isConnected) {
					setIsOffline(true);
					setRefreshing(false);
					setLoading(false);
				} else if (state.isConnected) {
					setIsOffline(false);
				}
			})
		}

		Linking.addEventListener('url', _handleRedirect);

		BackHandler.addEventListener('hardwareBackPress', _handleBackPress);

		let unsubscribe = NetInfo.addEventListener(
			_handleConnectivityChange
		);

		let addListenerUnSub = navigation.addListener('focus', () => {
			if (!isFirstRun.current) {
				_getOrderData();
				_getUserData();
			}
		});

		function _handleConnectivityChange(status) {
			if (status.isConnected) {
				setIsOffline(false);
			} else {
				setLoading(false);
				setIsOffline(true);
			}
		}

		function _handleBackPress() {
			navigation.goBack();
			return true;
		}

		init()

		return function cleanup() {
			unsubscribe();
			Linking.removeEventListener('url', _handleRedirect);
			BackHandler.removeEventListener('hardwareBackPress', _handleBackPress);
			addListenerUnSub();
		}
	}, [refreshing === true])

	useEffect(() => {
		if (Object.keys(dataSource).length > 0 && Object.keys(userFormData).length > 0) {
			setLoading(false)
		}
	}, [dataSource, userFormData])

	function _openPaymentModal() {
		setModalVisible(true);
	}

	function _closePaymentModal() {
		setModalVisible(false);
		navigation.popToTop();
		navigation.navigate('Meer', {
			screen: 'OrderDetails',
			params: {
				item: {
					OrderID: route.params.order_ID,
					UserID: route.params.customer_ID,
					Status: 'Betaald',
				},
			},
			initial: false,
		})
	}

	function _openAdressModal() {
		setFillAdressModalVisible(true)
	}

	function _closeNameModal() {
		setEmailExists(false)
		setEmailExistsVisible(false);
		setFillNameModalVisible(false);
	}

	function _openNameModal() {
		setFillNameModalVisible(true);
	}

	function _closeAddressModal() {
		setFillAdressModalVisible(false)
	}

	function _openBillingAddressModal() {
		setFillbillingAddressModalVisible(true)
	}

	function _closeBillingAddressModal() {
		setFillbillingAddressModalVisible(false)
	}

	async function _checkIfUserPaymentSucces(orderID, customerID) {
		let responseJson = await GetApiData._fetchRequest(
			{
				action: 'checkIfUserPaymentSucces',
				customerID,
				orderID
			},
			true,
			106080
		)
		if (responseJson !== '0' && Object.values(responseJson).length > 0 && typeof responseJson !== 'undefined') {
			setStatus(responseJson.OutParams.StatusParam)
			if (responseJson.OutParams.PaidParam === 1 && (responseJson.OutParams.StatusParam == 'Betaald' || responseJson.OutParams.StatusParam == 'Afgehandeld')) {
				_openPaymentModal();
				setPaymentDone(true);
			} else if (responseJson.OutParams.PaidParam === 0 && (responseJson.OutParams.StatusParam !== 'Betaald' && responseJson.OutParams.StatusParam !== 'Afgehandeld') && responseJson.OutParams.StatusParam !== 'Open') {
				_openPaymentFailedModal();
			} else {
				if ((responseJson.OutParams.StatusParam !== 'Betaald' && responseJson.OutParams.StatusParam !== 'Afgehandeld') && responseJson.OutParams.StatusParam !== 'Open') {
					ReportError._reportError(
						'1337',
						'checkifpaymentsuccess mislukt ' + responseJson.OutParams
					);
				}
			}
			setRefreshing(false)
		} else {
			navigation.goBack();
			ReportError._reportError(
				'1400',
				'Probably no reservation selected but still continued paid:' + responseJson.OutParams.PaidParam + ' OrderID: ' + route.params.order_ID,
				true
			);
		}
	}

	function _handleRedirect() {
		_checkIfUserPaymentSucces(
			route.params.order_ID,
			route.params.customer_ID
		);
	}

	async function _startPayment() {
		if (
			route.params.order_ID !== '' &&
			typeof route.params.order_ID !== 'undefined'
		) {
			if (
				userFormData.FirstName == '' ||
				userFormData.LastName == ''
			) {
				_openNameModal();
			} else {
				let orderID = parseInt(
					route.params.order_ID,
					10
				);
				orderID = orderID + 525168389451;
				let customerID = parseInt(
					route.params.customer_ID,
					10
				);
				customerID = customerID + 34856489498414;
				await Linking.openURL(
					`https://www.representin.nl/newapp/Mollie/payments/create-ideal-payment.php?param=` +
					orderID +
					'&param2=' +
					customerID
				);
			}
		} else {
			Alert.alert('Je hebt nog geen producten in jouw bestelling!');
			navigation.goBack();
		}
	}

	function _closePaymentFailedModal() {
		setModalPaymentFailedVisible(false)
		navigation.navigate('ShoppingCart')
		navigation.navigate('Meer', {
			screen: 'OrderDetails',
			params: {
				item: {
					OrderID: route.params.order_ID,
					UserID: route.params.customer_ID,
					Status: status,
				}
			},
			initial: false
		});
	}

	function _openPaymentFailedModal() {
		setModalPaymentFailedVisible(true);
	}

	async function _getAddressInfo(postcode, houseNumber) {
		setAddressPostCodeInput(postcode),
			setAddressHouseNumberInput(houseNumber)
		setTimeout(async () => {
			if (!getAddressInfoTimeOut) {
				if (
					typeof postcode !== 'undefined' &&
					typeof houseNumber !== 'undefined' &&
					houseNumber !== '' &&
					postcode !== ''
				) {
					let addressInfo = await GetApiData._getAddressInfo(
						postcode,
						houseNumber
					);
					if (
						typeof addressInfo.error === 'undefined' &&
						typeof addressInfo.street !== 'undefined'
					) {
						let replaceArr = Object.assign(
							{},
							addressInfo
						);
						setTempUserAddressData(replaceArr)
						setSaveAddressButton(false)
					}
				} else {
					let replaceArr = Object.assign(
						{},
						tempUserAddressData
					);
					replaceArr.Street = '';
					replaceArr.HouseNumber = '';
					replaceArr.PostCode = '';
					replaceArr.City = '';
					setTempUserAddressData(replaceArr)
					setSaveAddressButton(true)

				}
			} else {
				let replaceArr = Object.assign(
					{},
					tempUserAddressData
				);
				replaceArr.Street = '';
				replaceArr.HouseNumber = '';
				replaceArr.PostCode = '';
				replaceArr.City = '';
				setTempUserAddressData(replaceArr)
				setSaveAddressButton(true)
			}
			setGetAddressInfoTimeOut(false);
		}, 450);
	}

	async function _getBillingAddressInfo(postcode, houseNumber) {
		setTimeout(async () => {
			if (!getBillingAddressInfoTimeOut) {
				if (
					typeof postcode !== 'undefined' &&
					typeof houseNumber !== 'undefined' &&
					houseNumber !== '' &&
					postcode !== ''
				) {
					let addressInfo = await GetApiData._getAddressInfo(
						postcode,
						houseNumber
					);
					if (
						typeof addressInfo.error === 'undefined' &&
						typeof addressInfo.street !== 'undefined'
					) {
						let replaceArr = Object.assign(
							{},
							tempUserBillingAddressData
						);
						replaceArr.Street = addressInfo.street;
						replaceArr.HouseNumber = addressInfo.house_number;
						replaceArr.PostCode = addressInfo.postcode;
						replaceArr.City = addressInfo.city;
						setTempUserBillingAddressData(replaceArr)
						setSaveBillingAddressButton(false)
					} else {
						let replaceArr = Object.assign(
							{},
							tempUserBillingAddressData
						);
						replaceArr.Street = '';
						replaceArr.HouseNumber = '';
						replaceArr.PostCode = '';
						replaceArr.City = '';
						setTempUserBillingAddressData(replaceArr)
						setSaveBillingAddressButton(true)
					}
				} else {
					let replaceArr = Object.assign(
						{},
						tempUserBillingAddressData
					);
					replaceArr.Street = '';
					replaceArr.HouseNumber = '';
					replaceArr.PostCode = '';
					replaceArr.City = '';
					setTempUserBillingAddressData(replaceArr)
					setSaveBillingAddressButton(true)
				}
			}
			setGetBillingAddressInfoTimeOut(false)
		}, 450);
	}

	function _saveUserData() {
		SecureStore.getItemAsync('userData').then(async data => {
			let userData = JSON.parse(data);
			let responseJson = await GetApiData._fetchRequest(
				{
					action: 'saveCustomerDetails',
					customerID: userData.UserID,
					orderID: route.params.order_ID,
					street: tempUserAddressData.Street,
					houseNumber: tempUserAddressData.HouseNumber,
					postode: tempUserAddressData.PostCode,
					city: tempUserAddressData.City
				}
			)
			if (responseJson === '1') {
				_closeAddressModal();
				_getUserData();
			} else {
				Alert.alert('Niet gelukt! helaas');
			}
		});
	}

	function _saveUserNameData() {
		if (
			tempEmail.includes('@') &&
			tempEmail.includes(' ') == false &&
			tempEmail.includes(',') == false &&
			tempEmail.includes('.')
		) {
			setEmailIncorrect(false);
			SecureStore.getItemAsync('userData').then(async data => {
				let userData = JSON.parse(data);
				let responseJson = await GetApiData._fetchRequest(
					{
						action: 'saveUserDetails',
						userID: userData.UserID,
						firstName: tempFirstName,
						lastName: tempLastName,
						email: tempEmail
					},
					false
				)
				if (responseJson === '1') {
					setEmailIncorrect(false)
					_getUserData();
					_closeNameModal();
				} else if (responseJson === '-1') {
					setEmailIncorrect(false)
					Alert.alert('Niet gelukt! Neem contact met ons op');
				} else if (responseJson === '0') {
					if (Platform.OS === 'ios') {
						setFillNameModalVisible(false)
						setEmailExists(true);
					} else {
						setEmailExistsVisible(true);
					}
					setEmailIncorrect(true)
				}
			});
		} else {
			setEmailIncorrect(true);
		}
	}

	useEffect(() => {
		if (fillNameModalHidden && emailExists) {
			setEmailExistsVisible(true);
		}
	}, [fillNameModalHidden, emailExists])

	async function _deleteDiscountCode() {
		let body = JSON.stringify({
			action: 'deleteDiscountCode',
			customerID: route.params.customer_ID,
			orderID: route.params.order_ID
		})
		let response = await GetApiData._fetchRequest(body);
		if (response === '1') {
			setDiscountCodeFailed(false);
			_getOrderData();
		} else if (response === '0') {
			ReportError._reportError(
				'15000',
				'Discount code verwijderen van paymentoverview niet gelukt'
			);
		}
	}

	function _saveBillingUserData() {
		SecureStore.getItemAsync('userData').then(async data => {
			let userData = JSON.parse(data);
			let responseJson = await GetApiData._fetchRequest(
				{
					action: 'saveCustomerbillingDetails',
					customerID: userData.UserID,
					orderID: route.params.order_ID,
					billingStreet: tempUserBillingAddressData.Street,
					billingHouseNumber:
						tempUserBillingAddressData.HouseNumber,
					billingPostode: tempUserBillingAddressData.PostCode,
					billingCity: tempUserBillingAddressData.City
				}
			)

			if (responseJson === '1') {
				_closeBillingAddressModal();
				_getUserData();
			} else {
				Alert.alert('Niet gelukt!');
			}
		});
	}

	async function _getOrderData() {
		let response = await GetApiData._fetchRequest({
			action: 'getPaymentOverView',
			customerID: route.params.customer_ID,
			orderID: route.params.order_ID
		});
		if ((response[0] && response[0] !== 'leeg' && response[0] !== 0) || response[1] == '1') {
			try {
				setDataSource(response[1] != '1' ? response[0] : response[0][0]);
			} catch (error) {
				console.log(error);
				ReportError._reportError(
					'7001',
					'paymentoverviewscreen 525 getCustomerDetails ' +
					error,
					false
				);
			}
		} else {
			ReportError._reportError(
				'7005',
				'paymentoverviewscreen 533 PyamentOverviewScreen leeg'
			);
			navigation.goBack();
		}
	}

	function _getUserData() {
		SecureStore.getItemAsync('userData').then(async data => {
			let userData = JSON.parse(data);
			let responseJson = await GetApiData._fetchRequest(
				{
					action: 'getCustomerDetails',
					customerID: userData.UserID,
					orderID: route.params.order_ID
				}
			)
			if (responseJson && responseJson !== 'leeg') {
				try {
					let remoteUserData = responseJson[0];
					remoteUserData.FbPicture = userData.FbPicture;

					let userBillingData = {
						Street: remoteUserData.BillingStreet,
						HouseNumber: remoteUserData.BillingHouseNumber,
						PostCode: remoteUserData.BillingPostCode,
						City: remoteUserData.BillingCity
					};
					setUserFormData(remoteUserData);
					setUserBillingFormData(remoteUserData);
					setTempFirstName(remoteUserData.FirstName);
					setTempLastName(remoteUserData.LastName)
					setTempEmail(remoteUserData.Email);
					setAddressPostCodeInput(remoteUserData.PostCode)
					setAddressHouseNumberInput(remoteUserData.HouseNumber)
					setTempUserAddressData(remoteUserData)
					setTempUserBillingAddressData(userBillingData);
				} catch (error) {
					console.log(error);
					ReportError._reportError(
						'6000',
						'paymentoverviewscreen 577 getCustomerDetails ' +
						error,
						false
					);
				}
			} else {
				ReportError._reportError(
					'6000',
					'paymentoverviewscreen 580 getCustomerDetails leeg'
				);
			}
		})
			.catch(error => {
				console.log(error);
				ReportError._reportError(
					'6001',
					'paymentoverviewscreen 590 getCustomerDetails ' + error,
					false
				);
				Alert.alert(
					'Oops',
					'Er ging iets mis met de verbinding, probeer het later opnieuw of neem contact met ons op als dit probleem blijft.'
				);
				navigation.goBack();
			});
	}

	function _applyDiscountCode() {
		setApplyDiscountCodeBtnDisabled(true)
		SecureStore.getItemAsync('userData').then(async data => {
			let userData = JSON.parse(data);
			let responseJson = await GetApiData._fetchRequest(
				{
					action: 'applyDiscountCode',
					discountCode: discountCodeInput,
					orderID: route.params.order_ID,
					userID: userData.UserID
				}
			)
			if (responseJson && responseJson !== 'leeg' && responseJson[0].usedStatus !== '-1') {
				try {
					setDiscountCodeFailed(false);
					setDiscountCodeInput('');
					setApplyDiscountCodeBtnDisabled(false);
					_getOrderData();
				} catch (error) {
					console.log(error);
					ReportError._reportError(
						'6000',
						'paymentoverviewscreen 577 getCustomerDetails ' +
						error,
						false
					);
				}
			} else if (responseJson[0].usedStatus === '-1') {
				setDiscountStatusText('Deze code is al gebruikt, probeer een andere code!')
				setDiscountCodeFailed(true)
				setApplyDiscountCodeBtnDisabled(false);
			} else {
				setDiscountCodeFailed(true)
				setDiscountStatusText('Geen geldige code')
				setApplyDiscountCodeBtnDisabled(false);
			}
		})
	}


	if (Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="black" />
			</View>
		);
	} else if (isOffline) {
		return (
			<ErrorMessage
				onPress={() => setRefreshing(true)}
				retryMessage={false}
			/>
		);
	} else {
		if (dataSource == 'leeg') {
			return (
				<Text
					key={1}
					fontSize={20}
					style={{ alignContent: 'center', textAlign: 'center' }}
				>
					Er ging iets mis, controleer jouw bestelling
				</Text>
			);
		} else {
			let productTitle = dataSource.ProductAmount == 1 ? ' product ' : ' producten ';
			return (
				<KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={{ flex: 1 }}>
							<View style={styles.inner}>
								<ActionResultAlert
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									isVisible={modalVisible}
									onRequestNavigate={() => _closePaymentModal()}
									onRequestNavigateToOrder={() =>
										_closePaymentModal()
									}
									shoppingCartButton={false}
									positive={true}
									orderFailedModal={false}
									navigation={navigation}
									dataSource={{ Locatie: '', Plaatsnaam: '' }}
									onRequestClose={() => _closePaymentModal()}
									customMessage={'Bestelling succesvol afgerond!\n Je ontvangt van ons een bevestigingsmail\nmet de details.'}
									orderCheckModal={true}
								/>
								<ActionResultAlert
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									isVisible={modalPaymentFailedVisible}
									onRequestNavigate={() => {
										_closePaymentFailedModal();
									}}
									shoppingCartButton={false}
									positive={false}
									dataSource={{ Locatie: '', Plaatsnaam: '' }}
									onRequestClose={() => _closePaymentFailedModal()}
									customMessage={'De betaling kon niet succesvol worden afgerond,\nprobeer het nogmaals.'}
									orderCheckModal={true}
									orderFailedModal={true}
								/>
								<ActionResultAlert
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									isVisible={emailExistsVisible}
									onModalHide={() => setFillNameModalVisible(true)}
									onRequestNavigate={() => setEmailExistsVisible(false)}
									onRequestNavigateToOrder={() =>
										setEmailExistsVisible(false)
									}
									shoppingCartButton={false}
									positive={false}
									orderFailedModal={false}
									navigation={navigation}
									dataSource={{ Locatie: '', Plaatsnaam: '' }}
									onRequestClose={() => setEmailExistsVisible(false)}
									customMessage={'Email is al in gebruik bij een ander account'}
									orderCheckModal={false}
								/>
								<Modal
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									keyboardShouldPersistTaps={'always'}
									isVisible={
										fillbillingAddressModalVisible
									}
									onRequestClose={() =>
										_closeBillingAddressModal()
									}
								>
									<View
										style={{
											marginTop: 22,
											backgroundColor: 'white',
											alignSelf: 'center',
											height: 350,
											width: Dimensions.get('screen').width - 40
										}}
									>
										<View style={{ flex: 1 }}>
											<View
												style={{
													alignItems: 'center',
													flex: 1
												}}
											>
												<Icon
													onPress={() =>
														_closeBillingAddressModal()
													}
													name="cross"
													type="entypo"
													color="#517fa4"
													containerStyle={{
														width: 30,
														alignSelf: 'flex-end',
														marginTop: 5,
														marginRight: 5
													}}
												/>
												<View
													style={{
														alignItems: 'center',
														flexDirection: 'column',
														marginTop: 20,
														width:
															Dimensions.get('screen')
																.width - 50,
														flex: 1
													}}
												>
													<Text
														style={{
															fontSize: 17,
															marginBottom: 20,
															color: 'black'
														}}
													>
														Vul jouw factuur adres in
											</Text>
													<View
														style={{
															flexDirection: 'row',
															marginBottom: 10
														}}
													>
														<View
															style={{
																width: '30%',
																flexDirection: 'column'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginBottom: 10,
																	color: 'grey'
																}}
															>
																Postcode
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderColor:
																		'#cccccc',
																	borderRadius: 3
																}}
																onChangeText={async billingPostcode => {
																	_getBillingAddressInfo(
																		billingPostcode);
																}}
															/>
														</View>
														<View
															style={{
																flexDirection: 'column',
																marginLeft: 10,
																width: '30%',
																justifyContent:
																	'center',
																alignItems: 'center'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginBottom: 10,
																	color: 'grey'
																}}
															>
																Huisnummer
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderColor:
																		'#cccccc',
																	borderRadius: 3,
																	width: '80%'
																}}
																onChangeText={async billingHouseNumber => {
																	_getBillingAddressInfo(
																		billingHouseNumber
																	);
																}}
															/>
														</View>
													</View>
													{typeof tempUserBillingAddressData
														.Street !== 'undefined' &&
														tempUserBillingAddressData
															.Street !== '' ? (
															<View
																style={{
																	backgroundColor:
																		'#f7f7f7',
																	paddingRight: 10,
																	paddingLeft: 10,
																	paddingBottom: 10,
																	borderRadius: 3,
																	marginTop: 10
																}}
															>
																<Text
																	style={{
																		fontSize: 15,
																		color: 'grey',
																		marginTop: 5
																	}}
																>
																	Adres
													</Text>

																<Text
																	style={{
																		fontSize: 18,
																		marginTop: 5,
																		color: 'black'
																	}}
																>
																	{tempUserBillingAddressData
																		.Street +
																		' ' +
																		tempUserBillingAddressData
																			.HouseNumber}
																</Text>
																<Text
																	style={{
																		fontSize: 18,
																		color: 'black'
																	}}
																>
																	{tempUserBillingAddressData
																		.PostCode +
																		' ' +
																		tempUserBillingAddressData
																			.City}
																</Text>
															</View>
														) : null}
												</View>
											</View>
											<View
												style={{
													flexDirection: 'row',
													width:
														Dimensions.get('screen').width -
														160,
													alignSelf: 'center',
													alignContent: 'center',
													justifyContent: 'center',
													marginBottom: 15
												}}
											>

												<Button
													title={'Annuleren'}
													onPress={() =>
														_closeBillingAddressModal()
													}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'black',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#f8f9fa',
														borderRadius: 5,
														height: 40,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
												<Button
													disabled={saveBillingAddressButton
													}
													title="Opslaan"
													onPress={() =>
														_saveBillingUserData()
													}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'white',
														fontWeight: 'bold',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#007bff',
														borderRadius: 5,
														height: 40,
														marginLeft: 10,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
											</View>
										</View>
									</View>
								</Modal>
								<Modal
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									isVisible={fillNameModalVisible}
									onModalShow={() => setFillNameModalHidden(false)}
									onModalHide={() => setFillNameModalHidden(true)}
									keyboardShouldPersistTaps={'always'}
									onRequestClose={() => _closeNameModal()}
								>
									<View
										style={{
											marginTop: 22,
											backgroundColor: 'white',
											alignSelf: 'center',
											height: 350,
											width: Dimensions.get('screen').width - 40
										}}
									>
										<View style={{ flex: 1 }}>
											<View
												style={{
													alignItems: 'center',
													flex: 1
												}}
											>
												<Icon
													onPress={() =>
														_closeNameModal()
													}
													name="cross"
													type="entypo"
													color="#517fa4"
													containerStyle={{
														width: 30,
														alignSelf: 'flex-end',
														marginTop: 5,
														marginRight: 5
													}}
												/>
												<View
													style={{
														alignItems: 'center',
														flexDirection: 'column',
														marginTop: 10,
														width:
															Dimensions.get('screen')
																.width - 50,
														flex: 1
													}}
												>
													<View
														style={{
															flexDirection: 'column',
															width: '90%',
															alignItems: 'center'
														}}
													>
														<View
															style={{
																flexDirection: 'column',
																width: '90%'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginBottom: 5,
																	color: 'grey'
																}}
															>
																Voornaam
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderRadius: 3,
																	width: '100%',
																	borderColor:
																		'#cccccc'
																}}
																value={tempFirstName
																}
																onChangeText={FirstName => {
																	setTempFirstName(
																		FirstName
																	);
																}}
															/>
														</View>
														<View
															style={{
																flexDirection: 'column',
																width: '90%'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginTop: 10,
																	marginBottom: 5,
																	color: 'grey'
																}}
															>
																Achternaam
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderRadius: 3,
																	width: '100%',
																	borderColor:
																		'#cccccc'
																}}
																value={tempLastName
																}
																onChangeText={LastName => {
																	setTempLastName(LastName);
																}}
															/>
														</View>
														<View
															style={{
																flexDirection: 'column',
																width: '90%',
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginTop: 10,
																	marginBottom: 5,
																	color: 'grey'
																}}
															>
																Email
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderRadius: 3,
																	width: '100%',
																	borderColor:
																		emailIncorrect ? 'red' : '#cccccc'
																}}
																value={tempEmail
																}
																onChangeText={Email => {
																	setTempEmail(Email)
																}}
															/>
														</View>
													</View>
												</View>
											</View>
											<View
												style={{
													flexDirection: 'row',
													width:
														Dimensions.get('screen').width -
														160,
													alignSelf: 'center',
													alignContent: 'center',
													justifyContent: 'center',
													marginBottom: 20
												}}
											>
												<Button
													title={'Annuleren'}
													onPress={() =>
														_closeNameModal()
													}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'black',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#dbdbdb',
														borderRadius: 5,
														height: 40,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
												<Button
													disabled={
														tempFirstName ==
														'' ||
														tempLastName == ''
													}
													title="Opslaan"
													onPress={() =>
														_saveUserNameData()
													}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'white',
														fontWeight: 'bold',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#007bff',
														borderRadius: 5,
														height: 40,
														marginLeft: 10,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
											</View>
										</View>
									</View>
								</Modal>
								<Modal
									animationType="slide"
									backdropColor={'black'}
									backdropOpacity={0.7}
									isVisible={fillAdressModalVisible}
									keyboardShouldPersistTaps={'always'}
									onRequestClose={() => _closeAddressModal()}
								>
									<View
										style={{
											marginTop: 22,
											backgroundColor: 'white',
											alignSelf: 'center',
											height: 350,
											width: Dimensions.get('screen').width - 40
										}}
									>
										<View style={{ flex: 1 }}>
											<View
												style={{
													alignItems: 'center',
													flex: 1
												}}
											>
												<Icon
													onPress={() =>
														_closeAddressModal()
													}
													name="cross"
													type="entypo"
													color="#517fa4"
													containerStyle={{
														width: 30,
														alignSelf: 'flex-end',
														marginTop: 5,
														marginRight: 5
													}}
												/>
												<View
													style={{
														alignItems: 'center',
														flexDirection: 'column',
														marginTop: 20,
														width:
															Dimensions.get('screen')
																.width - 50,
														flex: 1
													}}
												>
													<Text
														style={{
															fontSize: 17,
															marginBottom: 20,
															color: 'black'
														}}
													>
														Vul jouw adres in
											</Text>
													<View
														style={{
															flexDirection: 'row',
															marginBottom: 10
														}}
													>
														<View
															style={{
																width: '30%',
																flexDirection: 'column'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginBottom: 10,
																	color: 'grey'
																}}
															>
																Postcode
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderRadius: 3,
																	borderColor:
																		'#cccccc'
																}}
																value={addressPostCodeInput
																}
																onChangeText={Postcode => {
																	_getAddressInfo(
																		Postcode,
																		addressHouseNumberInput
																	);
																}}
															/>
														</View>
														<View
															style={{
																flexDirection: 'column',
																marginLeft: 10,
																width: '33%',
																justifyContent:
																	'center',
																alignItems: 'center'
															}}
														>
															<Text
																style={{
																	fontSize: 15,
																	marginBottom: 10,
																	color: 'grey'
																}}
															>
																Huisnummer
													</Text>
															<TextInput
																style={{
																	borderWidth: 1,
																	paddingLeft: 10,
																	paddingRight: 10,
																	paddingTop: 5,
																	paddingBottom: 5,
																	fontSize: 18,
																	fontWeight: 'bold',
																	borderRadius: 3,
																	width: '80%',
																	borderColor:
																		'#cccccc'
																}}
																value={addressHouseNumberInput
																}
																onChangeText={houseNumber => {
																	_getAddressInfo(addressPostCodeInput,
																		houseNumber
																	);
																}}
															/>
														</View>
													</View>
													{typeof tempUserAddressData
														.Street !== 'undefined' &&
														tempUserAddressData.Street !==
														'' ? (
															<View
																style={{
																	backgroundColor:
																		'#f7f7f7',
																	paddingRight: 10,
																	paddingLeft: 10,
																	paddingBottom: 10,
																	borderRadius: 3,
																	marginTop: 5
																}}
															>
																<Text
																	style={{
																		fontSize: 15,
																		color: 'grey',
																		marginTop: 5
																	}}
																>
																	Adres
													</Text>
																<Text
																	style={{
																		fontSize: 18,
																		marginTop: 5,
																		color: 'black'
																	}}
																>
																	{
																		tempUserAddressData
																			.Street +
																		' ' +
																		tempUserAddressData
																			.HouseNumber}
																</Text>
																<Text
																	style={{
																		fontSize: 18,
																		color: 'black'
																	}}
																>
																	{tempUserAddressData
																		.PostCode +
																		' ' + tempUserAddressData
																			.City}
																</Text>
															</View>
														) : null}
												</View>
											</View>
											<View
												style={{
													flexDirection: 'row',
													width:
														Dimensions.get('screen').width -
														160,
													alignSelf: 'center',
													alignContent: 'center',
													justifyContent: 'center',
													marginBottom: 20
												}}
											>
												<Button
													title={'Annuleren'}
													onPress={() =>
														_closeAddressModal()
													}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'black',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#dbdbdb',
														borderRadius: 5,
														height: 40,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
												<Button
													disabled={
														saveAddressButton
													}
													title="Opslaan"
													onPress={() => _saveUserData()}
													titleStyle={{
														fontSize:
															Dimensions.get('screen')
																.width < 370
																? 17
																: 19,
														color: 'white',
														fontWeight: 'bold',
														marginTop: -4
													}}
													buttonStyle={{
														backgroundColor: '#007bff',
														borderRadius: 5,
														height: 40,
														marginLeft: 10,
														paddingLeft: 20,
														paddingRight: 20
													}}
												/>
											</View>
										</View>
									</View>
								</Modal>
								<Grid
									style={{
										padding: 10
									}}
								>

									<Text style={{ fontWeight: 'bold', fontSize: 17 }}>
										{'Jouw gegevens'}
									</Text>
									<TouchableOpacity
										onPress={() => _openNameModal()}
									>
										<Row
											style={{
												borderWidth: 1,
												marginTop: Dimensions.get('screen').height < 645 ? 5 : 15,
												flexDirection: 'column',
												padding: 10,
												height: 'auto',
												borderColor: '#cccccc',
												borderRadius: 3
											}}
										>
											<Row
												style={{
													flexDirection: 'row',
													height: 'auto'
												}}
											>
												<Grid>
													<Row style={{ height: 20 }}>
														<Text
															style={{
																fontSize: 15,
																flex: 1,
																height: 20,
																color:
																	userFormData.FirstName ==
																		'' ||
																		userFormData.LastName == ''
																		? 'red'
																		: 'black'
															}}
														>
															{userFormData.FirstName == '' ||
																userFormData.LastName == ''
																? 'Geen naam bekend'
																: userFormData.FirstName +
																' ' +
																userFormData.LastName}
														</Text>
													</Row>
													<Row style={{ height: 20 }}>
														<Text
															style={{
																fontSize: 15,
																flex: 1,
																height: 30
															}}
														>
															{userFormData.Email}
														</Text>
													</Row>
												</Grid>
												<EditIcon
													name="mode-edit"
													style={{
														alignSelf: 'flex-start'
													}}
													size={14}
												/>
											</Row>
										</Row>
									</TouchableOpacity>
									{route.params.includesOther ? (<React.Fragment><TouchableOpacity
										onPress={() => _openAdressModal()}
									>
										<Row
											style={{
												borderWidth: 1,
												marginTop: 15,
												flexDirection: 'column',
												padding: 10,
												height: 'auto',
												borderColor: '#cccccc',
												borderRadius: 3
											}}
										>
											<Row
												style={{
													flexDirection: 'row',
													height: 'auto'
												}}
											>
												<Text
													style={{
														color:
															userFormData.Street ||
																userFormData.HouseNumber
																? 'black'
																: 'red',
														fontSize: 15,
														flex: 1
													}}
												>
													{userFormData.Street ||
														userFormData.HouseNumber
														? userFormData.Street +
														' ' +
														userFormData.HouseNumber +
														',\n' +
														userFormData.PostCode +
														' ' +
														userFormData.City
														: 'Voor deze bestelling is de invoer van jouw adres noodzakelijk'}
												</Text>
												<EditIcon
													name="mode-edit"
													style={{
														alignSelf: 'flex-start'
													}}
													size={14}
												/>
											</Row>
										</Row>
									</TouchableOpacity>
										<Text
											style={{
												fontWeight: 'bold',
												marginTop: Dimensions.get('screen').height < 680 ? Dimensions.get('screen').height < 645 ? 5 : 15 : 15,
												fontSize: 17
											}}
										>
											Factuur adres
									</Text>
										<TouchableOpacity
											onPress={() => _openBillingAddressModal()}
										>
											<Row
												style={{
													borderWidth: 1,
													marginTop: Dimensions.get('screen').height < 645 ? 5 : 15,
													flexDirection: 'column',
													padding: 10,
													height: 'auto',
													borderColor: '#cccccc',
													borderRadius: 3
												}}
											>
												<Row
													style={{
														flexDirection: 'row',
														height: 'auto'
													}}
												>
													<Text
														style={{
															color: 'black',
															fontSize: 15,
															flex: 1
														}}
													>
														{userBillingFormData.BillingStreet ||
															userBillingFormData.BillingHouseNumber
															? userBillingFormData.BillingStreet +
															' ' +
															userBillingFormData.BillingHouseNumber +
															',\n' +
															userBillingFormData.BillingPostCode +
															' ' +
															userBillingFormData.BillingCity
															: 'Hetzelfde als bovenstaand adres. \nKlik hier indien je dit wilt wijzigen'}
													</Text>
													<EditIcon
														name="mode-edit"
														style={{
															alignSelf: 'flex-start'
														}}
														size={14}
													/>
												</Row>
											</Row>
										</TouchableOpacity>
									</React.Fragment>) : null}
									<Text
										style={{
											fontWeight: 'bold',
											marginTop: Dimensions.get('screen').height < 680 ? Dimensions.get('screen').height < 645 ? 5 : 15 : 15,
											fontSize: 17
										}}
									>
										Samenvatting
							</Text>
									<Row
										style={{
											borderWidth: 1,
											flexDirection: 'column',
											padding: 10,
											marginTop: Dimensions.get('screen').height < 645 ? 5 : 15,
											height: 'auto',
											borderColor: '#cccccc',
											borderRadius: 3
										}}
									>
										<Text
											style={{
												fontSize: 15
											}}
										>
											{dataSource.ProductAmount + productTitle + '€ '}
											{parseFloat(dataSource.SubTotal) % 1 ? parseFloat(dataSource.SubTotal).toFixed(2) : dataSource.SubTotal}
										</Text>

										<Text
											style={{
												fontSize: 15
											}}
										>
											{parseFloat(dataSource.ShippingAmount) % 1
												? 'Verzendkosten € ' +
												parseFloat(dataSource.ShippingAmount).toFixed(2)
												: 'Verzendkosten € ' +
												parseFloat(dataSource.ShippingAmount)}
										</Text>
										{parseFloat(dataSource.DiscountAmount) > 0 ?
											(<Text
												style={{
													fontSize: 15
												}}
											>
												{'Korting - € '}
												{parseFloat(dataSource.DiscountAmount) % 1 ? parseFloat(dataSource.DiscountAmount).toFixed(2) : dataSource.DiscountAmount}
											</Text>)
											: null
										}
										<Text
											style={{
												fontSize: 15
											}}
										>
											{parseFloat(dataSource.PaymentAmount) % 1
												? 'Totaal € ' +
												parseFloat(dataSource.PaymentAmount).toFixed(2)
												: 'Totaal € ' + parseFloat(dataSource.PaymentAmount)}
										</Text>

									</Row>
									{dataSource.DiscountTitle == '' ?
										<View>
											<Text
												style={{
													fontWeight: 'bold',
													marginTop: Dimensions.get('screen').height < 680 ? Dimensions.get('screen').height < 645 ? 5 : 15 : 15,
													fontSize: 17,
													marginBottom: 5
												}}
											>
												Kortingscode
										</Text>
											<Text>Vul de kortingscode in en klik op verrekenen:</Text>
											<TextInput
												style={{
													borderWidth: 1,
													paddingLeft: 10,
													paddingRight: 10,
													paddingTop: 10,
													paddingBottom: 10,
													fontSize: 15,
													marginTop: 4,
													height: 40,
													borderColor:
														discountCodeFailed ? 'red' : '#cccccc',
													borderRadius: 3
												}}
												autoCapitalize={'characters'}
												value={discountCodeInput}
												onChangeText={discountCode => {
													setDiscountCodeInput(discountCode)
												}}
											/>
										</View> : null}
									{dataSource.DiscountTitle !== '' || discountCodeFailed ?
										<View style={{ flexDirection: 'row' }}>
											<Text style={{ color: discountCodeFailed ? 'red' : 'green', marginTop: 5 }}>{dataSource.DiscountTitle ? '- ' + dataSource.DiscountTitle : discountStatusText} </Text>
											{!discountCodeFailed ? <DeleteIcon
												style={{}}
												name="delete"
												size={25}
												onPress={() => {
													_deleteDiscountCode();
												}}
											/> : null}
										</View>
										: null}
									{dataSource.DiscountTitle == '' ?
										<TouchableOpacity onPress={() => {
											!applyDiscountCodeBtnDisabled ? _applyDiscountCode() : null
										}} disabled={applyDiscountCodeBtnDisabled} >
											<Button buttonStyle={{ backgroundColor: 'black', marginTop: 5 }} titleStyle={{ color: 'white' }} title={'Verrekenen'}></Button>
										</TouchableOpacity> : null}
									<TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
										<Text style={{ marginTop: Dimensions.get('screen').height < 680 ? Dimensions.get('screen').height < 645 ? 5 : 18 : 18, fontSize: 12 }}>Bij het plaatsen van deze bestelling ga je akkoord met de algemene voorwaarden van Representin.nl</Text>
									</TouchableOpacity>
								</Grid>
							</View>
							<View
								size={30}
								style={{
									alignSelf: 'flex-end',
									alignItems: 'flex-end',
									marginTop: !discountCodeFailed ? 10 : 20,
									marginRight: 10,
									marginBottom: 10,
								}}
								containerStyle={{
									position: 'absolute',
									bottom: 10
								}}
							>
								<TouchableOpacity
									style={{
										flexDirection: 'row',
										backgroundColor: '#c06',
										marginBottom: 2,
										height: 35,
										borderRadius: 3,
										width: '100%',
										paddingRight: 15,
										alignItems: 'center'
									}}
									disabled={paymentDone}
									onPress={() => _startPayment()}
								>
									<Image
										style={{
											height: 25,
											width: 60,
											marginLeft: 0,
											resizeMode: 'contain'
										}}
										source={require('../assets/images/Ideal.png')}
									/>
									<Text
										style={{
											textAlign: 'center',
											color: 'white',
											fontSize: 20,
											fontWeight: 'bold'
										}}
									>
										Betalen met Ideal
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAwareScrollView>
			);
		}
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	inner: {
		flex: 1,
		justifyContent: "flex-end"
	},
	header: {
		fontSize: 36,
		marginBottom: 48
	},
	textInput: {
		height: 40,
		borderColor: "#000000",
		borderBottomWidth: 1,
		marginBottom: 36
	},
	btnContainer: {
		backgroundColor: "white",
		marginTop: 12
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	},
	headerLogo: {
		resizeMode: 'contain',
		marginTop: 5,
		width: 150,
		height: 95,
		marginLeft: 10
	}
});