import React, { useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
	StyleSheet,
	View,
	Image,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	FlatList,
	Alert,
	Dimensions,
	Platform,
	BackHandler
} from 'react-native';
import { Button } from 'react-native-elements';
import DeleteIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import NumericInput from 'react-native-numeric-input';
import { Col, Row, Grid } from 'react-native-easy-grid';
import ErrorMessage from '../components/ErrorMessage';
import ActionResultAlert from '../components/ActionResultAlert';
import GetApiListData from '../api/GetApiListData';
import ReportError from '../api/ReportError';
import NetInfo from "@react-native-community/netinfo";
import ReservationAlert from '../components/ReservationAlert';

export default function ShoppingCartScreen({ navigation, route }) {

	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [customer_ID, setCustomer_ID] = useState("");
	const [isNull, setIsNull] = useState(false);
	const [order_ID, setOrder_ID] = useState(false);
	const [isOffline, setIsOffline] = useState(false);
	const [maxProductAmountModal, setMaxProductAmountModal] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [reservationMdl, setReservationMdl] = useState([false, 0]);
	const [reservationChosen, setReservationChosen] = useState([]);
	const [noReservationChosenModal, setNoReservationChosenModal] = useState(false);
	const isFirstRun = useRef(true);
	const busyUpdating = useRef(false);

	const windowWidth = Dimensions.get('window').width;

	useEffect(() => {

		async function init() {
			if (isFirstRun.current) {
				_getConnectionInfo();
				isFirstRun.current = false;
				return;
			} else if (refreshing) {
				_GetOpenOrderFromUser();
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

		BackHandler.addEventListener('hardwareBackPress', _handleBackPress);

		let unsubscribe = NetInfo.addEventListener(
			_handleConnectivityChange
		);

		let addListenerUnSub = navigation.addListener('focus', () => {
			if (!isFirstRun.current) {
				_GetOpenOrderFromUser();
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

		function _GetOpenOrderFromUser() {
			SecureStore.getItemAsync('userData').then(async data => {
				let userID = JSON.parse(data);
				setCustomer_ID(userID.UserID)
				let responseJson = await GetApiListData._fetchRequest({
					action: 'getOpenOrderFromUser',
					userID: userID.UserID
				})
				let remoteResult = responseJson.Result;
				setOrder_ID(route.params
					? route.params.orderID
					: typeof remoteResult === 'undefined' ? 0 : remoteResult[0].OrderID);
				if (
					responseJson &&
					responseJson != 'leeg'
				) {
					remoteResult.forEach(item => {
						if (
							item.OutOfStock == 1 ||
							item.StockCurrent <= 0
						) {
							setIsNull(true)
						}
					});
					setDataSource(remoteResult)
				} else {
					setDataSource(responseJson);
					setLoading(false);
				}
			})
			setRefreshing(false);
		}

		function _handleBackPress() {
			navigation.goBack();
			return true;
		}

		init()

		return function cleanup() {
			unsubscribe();
			BackHandler.removeEventListener('hardwareBackPress', _handleBackPress);
			addListenerUnSub();
		}
	}, [refreshing === true])

	useEffect(() => {
		if (dataSource.length > 0) {
			setLoading(false)
			busyUpdating.current = false;
		}
	}, [dataSource, isFirstRun.current === false])

	function _renderSeperator() {
		return (
			<View
				style={{ height: 15, width: '100%', backgroundColor: 'white' }}
			/>
		);
	}

	async function _changeAmountOfItem(itemID, orderID, type, reservationID, amount, index, propertyID) {
		let responseJson = await GetApiListData._fetchRequest({
			action: 'pushNewItemAmount',
			itemID,
			orderID,
			type,
			reservationID,
			amount,
			propertyID
		})
		if (responseJson.Result == '0') {
			setMaxProductAmountModal(true);
			_onChange(index, parseInt(responseJson.CurrentAmount));
		} else {
			_onChange(
				index,
				parseInt(responseJson.CurrentAmount) || 0
			);
		}
	}

	async function _deleteItemFromCart(confirmID, itemID, orderID, type, propertyID) {
		let response = await GetApiListData._fetchRequest({
			action: 'deleteItemFromCart',
			confirmID,
			itemID,
			userID: customer_ID,
			orderID,
			type,
			propertyID
		})
		if (response === 2) {
			setRefreshing(true);
		} else {
			setRefreshing(true);
			ReportError._reportError(
				'13012',
				'Verwijderen item uit winkelwagen mislukt response: ' + response,
				true
			);
		}
	}

	async function _preparePayment() {
		let passedResCheck = await _checkReservationAvailable()
		setReservationChosen([]);
		let reservationChosenLocal = [];
		passedResCheck[1].forEach((element) => {
			if (element.ReservationEndMinutes == '' || element.ReservationEndTime == '' || element.ReservationMonth == '' || element.ReservationStartMinutes == '' || element.ReservationStartTime == '') {
				if (element.ReservationEnabled == '1') {
					reservationChosenLocal.push(element.PropertyID);
					setReservationChosen((old) => [...old, element.PropertyID]);
				} else if (element.ReservationEnabled == '-1') {
					reservationChosenLocal.push(element.PropertyID);
					setReservationChosen((old) => [...old, element.PropertyID]);
				}
			}
		})
		let price = parseFloat(
			passedResCheck[1].reduce(
				(sum, i) =>
					i.StockCurrent == '0' ||
						i.OutOfStock == '1' ||
						i.StockCurrent == '' ||
						typeof i.StockCurrent == 'undefined'
						? 1
						: (sum += i.Amount * i.Price),
				0
			)
		);
		var count = 0;
		passedResCheck[1].forEach(i => {
			(i.StockCurrent < 1 || i.OutOfStock > 0) &&
				i.StockCurrent !== '' &&
				i.StockCurrent !== 'undefined'
				? 0
				: (count += parseInt(i.Amount));
		});
		if (price !== 0 && price !== 1 && reservationChosenLocal.length === 0 && passedResCheck[0] == 1) {
			navigation.navigate('PaymentOverview', {
				order_ID,
				customer_ID,
			});
			setIsNull(false)
		} else if (price == 1) {
			Alert.alert(
				'Niet gelukt',
				'Je hebt één of meerdere uitverkocht(te) item(s) in je winkelwagen, deze kun je helaas niet bestellen',
				[
					{
						text: 'OK',
						onPress: () => console.log('OK Pressed')
					}
				],
				{ cancelable: false }
			);
		} else if (price == 0) {
			Alert.alert(
				'Niet gelukt',
				'Je moet minimaal 1 product bestellen',
				[
					{
						text: 'OK',
						onPress: () => console.log('OK Pressed')
					}
				],
				{ cancelable: false }
			);
		} else if (!reservationChosenLocal || passedResCheck[0] == 0 || passedResCheck[0] == -1) {
			setNoReservationChosenModal(true)
		}
	}

	async function _checkReservationAvailable() {
		return SecureStore.getItemAsync('userData').then(async data => {
			let userID = JSON.parse(data);
			let responseJson = await GetApiListData._fetchRequest({
				action: 'getOpenOrderFromUser',
				userID: userID.UserID
			})
			let remoteResult = responseJson.Result;
			if (
				responseJson &&
				responseJson != 'leeg'
			) {
				let result;
				remoteResult.forEach(item => {
					if (
						item.ReservationEnabled == 1 && item.ReservationMonth.length == 0
					) {
						result = 0
					}
				});
				setDataSource(remoteResult)
				return result == 0 ? [0, remoteResult] : [1, remoteResult];
			} else {
				console.log('error')
				return -1;
			}
		})
	}

	function _closeMaxProductAmountModal() {
		setMaxProductAmountModal(false)
	}

	function _closeReservationChosenModal() {
		setNoReservationChosenModal(false)
	}

	function _onChange(index, val) {
		setDataSource(dataSource.map((product, i) =>
			i === index ? { ...product, Amount: val } : product
		))
	}

	function _openDetails(Id, ItemID, Type) {
		if (ItemID) {
			if (Type == 'events') {
				// eslint-disable-next-line no-undef
				navigation.navigate('Details', {
					Id: ItemID,
					Shop: true
				});
			} else if (Type == 'activities') {
				// eslint-disable-next-line no-undef
				navigation.navigate('ActivityDetails', {
					Id: ItemID,
					Shop: true
				});
			} else {
				// eslint-disable-next-line no-undef
				navigation.navigate('ProductDetails', {
					Id: ItemID,
					Shop: true
				});
			}
		} else {
			if (Type == 'events') {
				// eslint-disable-next-line no-undef
				navigation.navigate('Details', { Id, Shop: true });
			} else if (Type == 'activities') {
				// eslint-disable-next-line no-undef
				navigation.navigate('ActivityDetails', {
					Id,
					Shop: true
				});
			} else {
				// eslint-disable-next-line no-undef
				navigation.navigate('ProductDetails', {
					Id,
					Shop: true
				});
			}
		}
	}

	function _renderItem({ item, index }) {
		let eventUri =
			'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
		let toDoUri =
			'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
		let activityUri =
			'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
		let productUri =
			'http://adminpanel.representin.nl/image.php?image=/sales/ProductFotos/';
		if (
			!(item.StockCurrent < 1 || item.OutOfStock > 0) &&
			item.StockCurrent !== '' &&
			typeof item.StockCurrent !== 'undefined' &&
			((item.ReservationEnabled == 1 && item.ResStockAvb > 0) || item.ReservationEnabled == 0)
		) {
			return (
				<TouchableOpacity
					key={item.PropertyID}
					onPress={() => {
						_openDetails(item.PropertyID, item.ItemID, item.ProductType);
					}}
				>
					<Row
						style={{
							height: 150,
							backgroundColor: '#f7f7f7',
							borderTopWidth: 1,
							borderBottomWidth: 1,
							borderColor: '#e3e3e3',
							shadowColor: '#000',
							shadowOffset: {
								width: 0,
								height: 1
							},
							shadowOpacity: 0.22,
							shadowRadius: 2.22,
							elevation: 3
						}}
					>
						<View>
							<ReservationAlert
								animationType="slide"
								backdropColor={'black'}
								backdropOpacity={0.7}
								item={item}
								isVisible={reservationMdl[0] && reservationMdl[1] == item.PropertyID}
								onModalHide={() => { setReservationMdl([false, item.PropertyID]); setRefreshing(true) }}
								onRequestClose={() => { setReservationMdl([false, item.PropertyID]); setRefreshing(true) }}
							/>
						</View>
						<View style={{ flexDirection: 'column', width: Dimensions.get('screen').width < 350 ? 200 : 250 }}>
							<Image
								source={
									item.ProductType == 'events'
										? item.Soort !== '0'
											? {
												uri: eventUri + item.Foto
											}
											: {
												uri: toDoUri + item.Foto
											}
										: item.ProductType == 'products'
											? { uri: productUri + item.Foto }
											: { uri: activityUri + item.Foto }
								}
								style={styles.headerLogo}
							/>
							<Grid>
								<Row size={200}>
									<Text
										style={{
											fontSize:
												item.Titel.length > 25
													? 15
													: 16,
											width: '95%',
											marginLeft: 10,
											fontWeight: 'bold',
											marginTop: item.Titel.length > 30 ? 5 : 2
										}}
									>
										{item.Titel}
									</Text>
								</Row>
								{item.Name ? (
									<React.Fragment>
										<Row size={100}>
											<Text
												style={{
													fontSize: 14,
													marginLeft: 10,
													marginTop: item.Titel.length > 30 ? -2 : -12
												}}
											>
												{item.Name}
											</Text>
										</Row>
										<Row size={100} style={{ width: windowWidth, justifyContent: 'flex-end' }}>
											{item?.ReservationDay !== '' && item?.ReservationEnabled === '1' ?
												<Text style={{ color: 'black', fontWeight: 'bold', marginTop: -5, marginRight: 5 }}>
													{'Reservering op: ' + item?.ReservationDay + '-' + item?.ReservationMonth + ' ' + item?.ReservationStartTime + ':' + item?.ReservationStartMinutes + 'u - ' + item?.ReservationEndTime + ':' + item?.ReservationEndMinutes + 'u'}
												</Text>
												: reservationChosen.includes(item?.PropertyID) && item?.ReservationDay == '' ?
													<Text style={{ color: 'red', marginTop: -5, marginRight: 5 }}>
														{'Selecteer een reserveringsdatum'}
													</Text> : null}
										</Row>
									</React.Fragment>
								) : null}
							</Grid>
						</View>
						<Col
							style={{
								alignContent: 'center',
								justifyContent: 'center',
								marginRight: 20
							}}
						>
							<Row
								style={{
									alignSelf: 'flex-end',
									flexDirection: 'column'
								}}
							>
								<Text
									style={{
										fontSize: 17,
										marginTop: 3,
										color: 'black',
										marginRight: 10
									}}
								>
									{parseFloat(item.Price) % 1
										? '€ ' +
										parseFloat(item.Price).toFixed(2)
										: '€ ' + parseFloat(item.Price)}
								</Text>
								{item.OldPrice > 0 ? (
									<Col
										style={{
											width: 'auto',
											alignItems: 'flex-end',
											marginRight: 10
										}}
									>
										<Text
											style={{
												color: 'grey',
												marginTop: 5,
												fontSize: 16,
												textDecorationLine:
													'line-through',
												width: 'auto'
											}}
										>
											{parseFloat(item.OldPrice) % 1
												? '€ ' +
												parseFloat(
													item.OldPrice
												).toFixed(2)
												: '€ ' +
												parseFloat(item.OldPrice)}
										</Text>
									</Col>
								) : null}
							</Row>
							<Row
								style={{
									justifyContent: 'flex-end',
									marginTop: item.ReservationEnabled == 1 ? -20 : -40
								}}
							>
								<NumericInput
									totalHeight={40}
									totalWidth={100}
									minValue={1}
									editable={false}
									rounded
									initValue={parseInt(item.Amount)}
									onChange={amount => {
										if (amount != item.Amount && amount > 0 && !busyUpdating.current) {
											busyUpdating.current = true;
											_changeAmountOfItem(
												item.ItemID,
												item.OrderID,
												item.ProductType,
												item.ReservationID,
												amount,
												index,
												item.PropertyID
											);
										}
									}}
								/>
							</Row>
							{item.ReservationEnabled == 1 ?
								<Row style={{ width: 93, alignSelf: 'flex-end', }}>
									<TouchableOpacity style={{ height: 30, borderRadius: 5, alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: 'black' }} onPress={() => setReservationMdl([true, item.PropertyID])}>
										<Text style={{ fontSize: 15, color: 'white', marginLeft: 5, marginRight: 5, marginTop: Platform.OS === 'ios' ? 0 : -2 }}>Reserveren</Text>
									</TouchableOpacity>
								</Row>
								: null}
						</Col>
						<TouchableOpacity style={{ height: 32, width: 25, position: 'absolute', top: 0, right: 0 }}
							onPress={() => {
								_deleteItemFromCart(
									item.ConfIrmID,
									item.ItemID,
									item.OrderID,
									item.ProductType,
									item.PropertyID
								);
							}}>
							<DeleteIcon
								style={{ position: 'absolute', top: 2, right: 0 }}
								name="delete"
								size={25}
							/>
						</TouchableOpacity>
					</Row>
				</TouchableOpacity>
			);
		} else {
			return (
				<TouchableOpacity
					key={item.PropertyID}
					onPress={() => {
						_openDetails(item.PropertyID, item.ItemID, item.ProductType);
					}}
				>
					<Row
						style={{
							height: 150,
							backgroundColor: '#f7f7f7',
							borderTopWidth: 1,
							borderBottomWidth: 1,
							borderColor: '#e3e3e3',
							shadowColor: '#000',
							shadowOffset: {
								width: 0,
								height: 1
							},
							shadowOpacity: 0.22,
							shadowRadius: 2.22,
							elevation: 3
						}}
					>
						<View style={{ flexDirection: 'column', width: Dimensions.get('screen').width < 350 ? 200 : 250 }}>
							<Image
								source={
									item.ProductType == 'events'
										? item.Soort !== '0'
											? {
												uri: eventUri + item.Foto
											}
											: {
												uri: toDoUri + item.Foto
											}
										: { uri: activityUri + item.Foto }
								}
								style={styles.headerLogo}
							/>
							<Grid>
								<Row size={200}>
									<Text
										style={{
											fontSize:
												item.Titel.length > 25
													? 15
													: 16,
											width: '95%',
											marginLeft: 10,
											fontWeight: 'bold',
											marginTop: item.Titel.length > 30 ? 5 : 2
										}}
									>
										{item.Titel}
									</Text>
								</Row>
								{item.Name ? (
									<React.Fragment>
										<Row size={100}>
											<Text
												style={{
													fontSize: 14,
													marginLeft: 10,
													marginTop: item.Titel.length > 30 ? -2 : -12
												}}
											>
												{item.Name}
											</Text>
										</Row>
										<Row size={100} style={{ width: windowWidth, justifyContent: 'flex-end' }}>
											{item?.ReservationDay !== '' && item?.ReservationEnabled === '1' ?
												<Text style={{ color: 'black', fontWeight: 'bold', marginTop: -5, marginRight: 5 }}>
													{'Reservering op: ' + item?.ReservationDay + '-' + item?.ReservationMonth + ' ' + item?.ReservationStartTime + ':' + item?.ReservationStartMinutes + 'u - ' + item?.ReservationEndTime + ':' + item?.ReservationEndMinutes + 'u'}
												</Text>
												: reservationChosen.includes(item?.PropertyID) && item?.ReservationDay == '' ?
													<Text style={{ color: 'red', marginTop: -5, marginRight: 5 }}>
														{'Selecteer een reserveringsdatum'}
													</Text> : null}
										</Row>
									</React.Fragment>
								) : null}
							</Grid>
						</View>
						<Col
							style={{
								alignContent: 'center',
								justifyContent: 'center',
								marginRight: 20
							}}
						>
							<Row
								style={{
									alignSelf: 'flex-end',
									flexDirection: 'column'
								}}
							>
								<Text
									style={{
										fontSize:
											Dimensions.get('window').width < 380
												? Dimensions.get('window')
													.width < 340
													? 13
													: 15
												: 17,
										marginTop: 3,
										color: 'red',
										marginRight: 10
									}}
									adjustsFontSizeToFit={true}
								>
									{'Uitverkocht'}
								</Text>
								<Col
									style={{
										width: 'auto',
										alignItems: 'flex-end'
									}}
								>
									<Text
										style={{
											color: 'red',
											marginTop: 5,
											fontSize: 16,
											marginRight: 5,
											textDecorationLine: 'line-through',
											width: 'auto'
										}}
									>
										{'€ ' + item.Price}
									</Text>
								</Col>
							</Row>
						</Col>
						<DeleteIcon
							style={{
								position: 'absolute',
								top: 2,
								right: 0
							}}
							name="delete"
							size={25}
							onPress={() => {
								_deleteItemFromCart(
									item.ConfIrmID,
									item.ItemID,
									item.OrderID,
									item.ProductType,
									item.PropertyID
								);
								setRefreshing(true)
							}}
						/>
					</Row>
				</TouchableOpacity>
			);
		}
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
				<ErrorMessage
					customMessage={'Geen producten in je winkelmand'}
					retryMessage={false}
				/>
			);
		} else if (dataSource !== null && dataSource !== [] && dataSource.length > 0) {
			return (
				<React.Fragment>
					<ActionResultAlert
						animationType="slide"
						backdropColor={'black'}
						backdropOpacity={0.7}
						isVisible={maxProductAmountModal}
						onRequestClose={() =>
							_closeMaxProductAmountModal()
						}
						positive={false}
						dataSource={dataSource[0]}

						customTitle={'Je hebt het maximale aantal \n van dit product bereikt.'}
					/>
					<ActionResultAlert
						animationType="slide"
						backdropColor={'black'}
						backdropOpacity={0.7}
						isVisible={noReservationChosenModal}
						onRequestClose={() =>
							_closeReservationChosenModal()
						}
						positive={false}
						dataSource={dataSource[0]}
						customTitle={'Bij één van de producten mist een reserveringsdatum'}
					/>
					<View
						style={{
							height: 50,
							width: '100%',
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<Text>Items in de winkelwagen</Text>
						{route.params ? (
							<Text style={{ fontSize: 13 }}>
								{'Bestelling #' +
									route.params
										.orderID}
							</Text>
						) : null}
					</View>
					<FlatList
						data={dataSource}
						renderItem={_renderItem}
						// eslint-disable-next-line no-unused-vars
						keyExtractor={(item, index) => item.PropertyID}
						ItemSeparatorComponent={_renderSeperator}
						initialNumToRender={10}
						getItemLayout={(data, index) => (
							{ length: 150, offset: 150 * index, index }
						)}
						windowSize={10}
					/>
					<View
						style={{
							height: 45,
							backgroundColor: '#f9f9f9',
							width: '100%',
							elevation: 5
						}}
					>
						<Grid>
							<Col
								style={{
									marginLeft: 20
								}}
								size={25}
							>
								<Text
									style={{
										color: 'black',
										fontSize: 11,
										position: 'absolute',
										top: 5,
										left: 0
									}}
								>
									{'Totaalbedrag:'}
								</Text>
								<Text
									style={{
										width: 'auto',
										color: 'black',
										marginTop: 15,
										fontSize: 19,
										fontWeight: 'bold'
									}}
								>
									{parseFloat(
										dataSource.reduce(
											(sum, i) =>
											(sum +=
												(i.StockCurrent < 1 ||
													i.OutOfStock > 0) &&
													i.StockCurrent !== '' &&
													i.StockCurrent !==
													'undefined'
													? 0
													: i.Amount *
													i.Price),
											0
										)
									) % 1
										? '€ ' +
										parseFloat(
											dataSource.reduce(
												(sum, i) =>
												(sum +=
													(i.StockCurrent <
														1 ||
														i.OutOfStock >
														0) &&
														i.StockCurrent !==
														'' &&
														i.StockCurrent !==
														'undefined'
														? 0
														: i.Amount *
														i.Price),
												0
											)
										).toFixed(2)
										: '€ ' +
										parseFloat(
											dataSource.reduce(
												(sum, i) =>
												(sum +=
													(i.StockCurrent <
														1 ||
														i.OutOfStock >
														0) &&
														i.StockCurrent !==
														'' &&
														i.StockCurrent !==
														'undefined'
														? 0
														: i.Amount *
														i.Price),
												0
											)
										)}
								</Text>
							</Col>
							<Col
								size={15}
								style={{
									marginTop: 3,
									marginRight: 5,
									alignSelf: 'flex-end'
								}}
							>
								<Button
									title={'Afrekenen'}
									titleStyle={{
										fontSize: 20,
										color: 'white',
										fontWeight: 'bold',
										marginTop: Platform.OS == 'ios' ? -4 : -2
									}}
									buttonStyle={{
										backgroundColor: '#28a745',
										height: '100%',
										width: 'auto',
										borderRadius: 5
									}}
									containerStyle={{
										marginTop: 2,
										marginRight: 0,
										marginBottom: 5
									}}
									disabled={isNull}
									onPress={() => _preparePayment()}
								/>
							</Col>
						</Grid>
					</View>
				</React.Fragment>
			);
		}
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		justifyContent: 'center',
		flex: 1
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10
	},
	headerLogo: {
		resizeMode: 'stretch',
		marginTop: 10,
		marginLeft: 10,
		width: 150,
		height: 80
	}
});
