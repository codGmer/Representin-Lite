/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Image,
	Text,
	ActivityIndicator,
	BackHandler,
	TouchableOpacity,
	Dimensions,
	FlatList,
	Platform,
	Alert
} from 'react-native';
import ReportError from '../api/ReportError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-elements';
import { Col, Row, Grid } from 'react-native-easy-grid';
import DeleteIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import GetApiListData from '../api/GetApiListData';

export default function OrderDetailsScreen({ navigation, route }) {
	const [dataSource, setDataSource] = useState([]);
	const [Loading, setLoading] = useState([]);
	const [userLocation, setUserLocation] = useState([]);
	const [outParams, setOutParams] = useState([]);
	const [error, setError] = useState(false);

	useEffect(() => {
		async function init() {
			navigation.setOptions({
				headerRight: () => (
					<DeleteIcon
						style={{
							marginRight: 15
						}}
						color={'white'}
						name="delete"
						size={25}
						onPress={() => {
							_hideOrder();
						}}
					/>
				),
			});

			const unsubscribe = navigation.addListener('focus', async () => {
				_getOrderItemsFromOrder();
			});

			BackHandler.addEventListener('hardwareBackPress', _handleBackPress);

			return function cleanup() {
				BackHandler.removeEventListener('hardwareBackPress', _handleBackPress);
				unsubscribe();
			}

			function _handleBackPress() {
				navigation.goBack();
				return true;
			}
		}

		async function getUserlocation() {
			let userlocation = await AsyncStorage.getItem('userLocation');
			let userLocation = JSON.parse(userlocation);
			if (userLocation != 'null') {
				setUserLocation(userLocation);
			} else {
				setUserLocation([]);
			}
			BackHandler.addEventListener('hardwareBackPress', handleBackPress);
		}

		init();
		getUserlocation();

		return function cleanUp() {
			BackHandler.removeEventListener(
				'hardwareBackPress',
				handleBackPress
			);
		}
	}, []);

	useEffect(() => {
		if (error) {
			navigation.goBack();
		}
	}, [error]);

	function handleBackPress() {
		navigation.goBack();
		return true;
	}

	async function _getOrderItemsFromOrder() {
		let response = await GetApiListData._fetchRequest({
			action: 'getOrderItemsFromOrder',
			orderID: route.params.item.OrderID,
			userID: route.params.item.UserID
		});
		setOutParams(response.OutParams)
		if (response != 'null' && response !== 'leeg') {
			_calculateDistance(response);
			setLoading(false);
		} else {
			ReportError._reportError(20005, 'getOrderItemsFromOrder leeg', true);
			navigation.goBack();
		}
	}

	function renderItem({ item }) {
		let eventUri =
			'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
		let toDoUri =
			'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
		let activityUri =
			'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
		let productUri =
			'http://adminpanel.representin.nl/image.php?image=/sales/ProductFotos/';
		if (
			(!(item.StockCurrent < 1 || item.OutOfStock > 0) &&
				item.StockCurrent !== '' &&
				typeof item.StockCurrent !== 'undefined') ||
			(route.params.item.Status == 'Betaald' || route.params.item.Status == 'Afgehandeld')
		) {
			return (
				<TouchableOpacity
					key={item.Id}
					onPress={() => {
						_openDetails(item.Id, item.ItemID, item.Type);
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
						<View
							style={{
								flexDirection: 'column',
								width: 250
							}}
						>
							<Image
								source={
									item.Type == 'events'
										? item.Soort !== '0'
											? {
												uri: eventUri + item.Foto
											}
											: {
												uri: toDoUri + item.Foto
											}
										: item.Type == 'products'
											? { uri: productUri + item.Foto }
											: { uri: activityUri + item.Foto }
								}
								style={styles.headerLogo}
							/>
							<Grid>
								<Row size={50}>
									<Text
										style={{
											fontSize:
												item.Titel.length > 25
													? 15
													: 16,
											width: '100%',
											marginLeft: 10,
											fontWeight: 'bold',
											marginTop: 5
										}}
									>
										{item.Titel}
									</Text>
								</Row>
								{item.PriceLabel && (route.params.item.Status == 'Betaald' || route.params.item.Status == 'Afgehandeld') ? (
									<Row size={70}>
										<Text
											style={{
												fontSize: 14,
												marginLeft: 10,
											}}
										>
											{item.PriceLabel}
										</Text>
									</Row>
								) : null}
								{item.Name && (route.params.item.Status !== 'Betaald' && route.params.item.Status !== 'Afgehandeld') ? (
									<Row size={70}>
										<Text
											style={{
												fontSize: 14,
												marginLeft: 10
											}}
										>
											{item.Name}
										</Text>
									</Row>
								) : null}
							</Grid>
						</View>
						<Col
							style={{
								alignContent: 'center',
								justifyContent: 'center',
								paddingRight: 10
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
										marginTop: 5,
										color: 'black',
										marginRight: 10,
										width: '100%'
									}}
								>
									{parseFloat(item.Price) % 1
										? item.Amount +
										' x € ' +
										parseFloat(item.Price).toFixed(2)
										: item.Amount +
										' x € ' +
										parseFloat(item.Price)}
								</Text>
							</Row>
							{typeof item.ExtOrderID !== 'undefined' && item.ExtOrderID !== '' && item.ExtOrderID !== null ?
								<Row
									style={{
										alignSelf: 'flex-end',
										flexDirection: 'row'
									}}
								>
									<Text
										style={{
											fontSize: 17,
											marginTop: 5,
											color: 'black'
										}}
									>
										{'Code: '}
									</Text>
									<Text
										style={{
											fontSize: 17,
											marginTop: 5,
											color: +item.Claimed ? 'red' : 'green',
											textDecorationLine: +item.Claimed ? 'line-through' : 'none',
										}}
									>
										{item.ExtOrderID}
									</Text>
								</Row>
								: <Row
									style={{
										alignSelf: 'flex-end',
										flexDirection: 'column',
									}}
								/>}
							{item?.ReservationMonth?.length > 0 ?
								<Row
									style={{
										alignSelf: 'flex-end',
										flexDirection: 'column',
										height: 20
									}}
								>
									<Text
										style={{
											color: 'black',
											fontWeight: 'bold',
											marginRight: 5,
											width: '100%'
										}}
									>
										{'Reservering op: ' + item?.ReservationDay + '-' + item?.ReservationMonth + ' ' + item?.ReservationStartTime + ':' + item?.ReservationStartMinutes + 'u - ' + item?.ReservationEndTime + ':' + item?.ReservationEndMinutes + 'u'}
									</Text>
								</Row>
								: null}
						</Col>
					</Row>
				</TouchableOpacity>
			);
		} else {
			try {
				return (
					<TouchableOpacity
						key={item.Id}
						onPress={() => {
							_openDetails(item.Id, item.ItemID, item.Type);
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
							<View style={{ flexDirection: 'column', width: 250 }}>
								<Image
									source={
										item.Type == 'events'
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
									<Row size={18}>
										<Text
											style={{
												fontSize:
													item.Titel.length > 25
														? 15
														: 16,
												width: '100%',
												marginLeft: 10,
												fontWeight: 'bold'
											}}
										>
											{item.Titel}
										</Text>
									</Row>
									<Row size={25}>
										<Text
											style={{
												fontSize: 14,
												marginLeft: 10
											}}
										>
											{item.Datum_Begin}
										</Text>
									</Row>
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
									_hideOrder(
										item.Order_ItemID,
										item.OrderID
									);
									_getOrderItemsFromOrder()
								}}
							/>
						</Row>
					</TouchableOpacity>
				);
			} catch (error) {
				console.log('orderDetailsScreen ' + error)
				ReportError._reportError(20010, 'orderDetailsScreen mysql error ' + JSON.stringify(error), true);
				setError(true);
			}
		}
	}

	function _openDetails(Id, ItemID, Type) {
		if (ItemID) {
			if (Type == 'events') {
				navigation.navigate('MoreScreenDetails', {
					Id: ItemID,
					Shop: true
				});
			} else if (Type == 'activities') {
				navigation.navigate('MoreScreenActivityDetails', {
					Id: ItemID,
					Shop: true
				});
			} else {
				navigation.navigate('ProductDetails', {
					Id: ItemID,
					Shop: true
				});
			}
		} else {
			if (Type == 'events') {
				navigation.navigate('MoreScreenDetails', { Id, Shop: true });
			} else if (Type == 'activities') {
				navigation.navigate('MoreScreenActivityDetails', {
					Id,
					Shop: true
				});
			} else {
				navigation.navigate('ProductDetails', {
					Id,
					Shop: true
				});
			}
		}
	}

	async function _hideOrder() {
		let response = await GetApiListData._fetchRequest({
			action: 'hideOrderFromUser',
			orderID: route.params.item.OrderID
		})
		if (response === '1') {
			navigation.goBack();
		} else {
			Alert.alert(
				'Het verwijderen is niet gelukt, probeer het later opnieuw of neem contact met ons op.'
			);
		}
	}

	function _calculateDistance(itemList) {
		let items = itemList.Result
		for (let index = 0; index < Object.keys(items).length; index++) {
			if (userLocation.length !== 0) {
				let distance = _calculateDistanceTwoPoints(
					userLocation.coords.latitude,
					userLocation.coords.longitude,
					items[index].Lat,
					items[index].Lng
				);
				distance < 300 || distance == ''
					? (items[index].distance = distance)
					: (items[index].distance = '-');
			} else {
				items[index].distance = '-';
			}
		}
		setDataSource(items);
	}

	function _calculateDistanceTwoPoints(uLat, uLng, fLat, fLng) {
		//uLat = user latitude
		//fLat = festival latitude

		var R = 6371; // km
		//has a problem with the .toRad() method below.
		var x1 = fLat - uLat;
		var dLat = _toRad(x1);
		var x2 = fLng - uLng;
		var dLon = _toRad(x2);
		var a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(_toRad(uLat)) *
			Math.cos(_toRad(fLat)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;
		return Math.round(d * 10) / 10;
	}

	function _toRad(Value) {
		/** Converts numeric degrees to radians */
		return (Value * Math.PI) / 180;
	}

	function renderSeperator() {
		return (
			<View
				style={{ height: 15, width: '100%', backgroundColor: 'white' }}
			/>
		);
	}

	if (Loading) {
		return (
			<View
				style={{
					alignItems: 'center',
					flex: 1,
					justifyContent: 'center'
				}}
			>
				<ActivityIndicator size="large" color="black" />
			</View>
		);
	} else {
		if (dataSource == 'leeg') {
			return (
				<Text
					key={1}
					fontSize={20}
					style={{ alignContent: 'center', textAlign: 'center' }}
				>
					Er ging iets mis, neem contact met ons op als dit scherm
					blijft.
				</Text>
			);
		} else {
			return (
				<React.Fragment>
					<View
						style={{
							height: 50,
							width: '100%',
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<Text>
							{'Items in bestelling #' +
								route.params.item
									.OrderID}
						</Text>
					</View>
					<FlatList
						data={dataSource}
						renderItem={renderItem}
						keyExtractor={(item, index) => item.HistoryID ? item.HistoryID : item.PropertyID}
						ItemSeparatorComponent={renderSeperator}
						initialNumToRender={10}
						getItemLayout={(data, index) => (
							{ length: 180, offset: 180 * index, index }
						)}
						windowSize={10}
					/>
					<View
						style={{
							backgroundColor: '#f9f9f9',
							width: '100%',
							elevation: 5,
							paddingTop: 1,
							height: outParams.DiscountAmountOut > 0 ? outParams.ShippingAmountOut > 0 ? 100 : 78 : outParams.ShippingAmountOut > 0 ? 85 : (route.params.item.Status !== 'Betaald' && route.params.item.Status !== 'Afgehandeld') ? 75 : 43
						}}
					>
						<Grid>
							<Col
								style={{
									width: '100%',
									marginLeft: 20,
									justifyContent:
										(route.params.item
											.Status !== 'Betaald' && route.params.item.Status !== 'Afgehandeld')
											? parseFloat(outParams.ShippingAmountOut) == 0
												? 'flex-start'
												: 'center'
											: 'flex-start',
									height: outParams.DiscountAmountOut > 0 ? 10 : 20,
									flexDirection: 'row'
								}}
							>
								<Col
									style={{
										flex: 1,
										width:
											parseFloat(outParams.ShippingAmountOut) > 0
												? '44%'
												: '45%',
										marginTop:
											parseFloat(outParams.ShippingAmountOut) > 0
												? Platform.OS == 'ios'
													? 10
													: 8
												: outParams.ShippingAmountOut == 0 && outParams.DiscountAmountOut == 0 ? 10 : 0
									}}
								>
									{outParams.SubTotalOut && outParams.SubTotalOut != outParams.TotalOut ?
										<Text
											style={{
												width: 'auto',
												color: 'black',
												marginTop:
													parseFloat(outParams.SubTotalOut) >
														0
														? 0
														: 10,
												borderColor: '#f9f9f9',
												borderWidth: 1,
												fontSize: 14,
												height: 20
											}}
										>
											{parseFloat(outParams.SubTotalOut) % 1
												? 'Subtotaal: € ' +
												parseFloat(
													outParams.SubTotalOut
												).toFixed(2)
												: 'Subtotaal: € ' +
												parseFloat(outParams.SubTotalOut)}
										</Text>
										: null}
									{parseFloat(outParams.ShippingAmountOut) != 0.0 ? (
										<Text style={{
											height: 20
										}}>
											{parseFloat(outParams.ShippingAmountOut) % 1
												? 'Verzendkosten: + € ' +
												parseFloat(
													outParams.ShippingAmountOut
												).toFixed(2)
												: 'Verzendkosten: + € ' +
												parseFloat(outParams.ShippingAmountOut)}
										</Text>
									) : null}

									{outParams.DiscountAmountOut != 0 ?
										<Text
											style={{
												width: 'auto',
												color: 'black',
												borderColor: '#f9f9f9',
												borderWidth: 1,
												fontSize: 14,
												height: 20
											}}
										>
											{parseFloat(outParams.DiscountAmountOut) % 1
												? 'Korting: - € ' +
												parseFloat(
													outParams.DiscountAmountOut
												).toFixed(2)
												: 'Korting: - € ' +
												parseFloat(outParams.DiscountAmountOut)}
										</Text>
										: null}
									<Text
										style={{
											width: 'auto',
											color: 'black',
											fontSize: 18,
											fontWeight: 'bold',
											height: 20
										}}
									>
										{parseFloat(outParams.TotalOut) % 1
											? 'Totaal: € ' +
											parseFloat(
												outParams.TotalOut
											).toFixed(2)
											: 'Totaal: € ' +
											parseFloat(outParams.TotalOut)}
									</Text>
								</Col>
								{(route.params.item.Status !== 'Betaald' && route.params.item.Status !== 'Afgehandeld') &&
									parseFloat(outParams.TotalOut) !== 0 ? (
									<Col
										style={{
											marginTop:
												outParams.DiscountAmountOut > 0 ? outParams.ShippingAmountOut > 0 ? 3 : 35 : outParams.ShippingAmountOut > 0 ? 35 : 3,
											alignItems: 'flex-end'
										}}
									>
										<Button
											title={'Afronden'}
											onPress={() => {
												navigation.navigate('Shop', {
													screen: 'ShoppingCart',
													initial: false
												});
											}}
											titleStyle={{
												fontSize:
													Dimensions.get('screen')
														.width < 370
														? 17
														: 19,
												color: 'black',
												fontWeight: 'bold',
												marginTop:
													Platform.OS == 'ios'
														? -4
														: -2
											}}
											icon={{
												name: 'md-checkmark',
												type: 'ionicon',
												color: 'black'
											}}
											iconContainerStyle={{
												marginTop:
													Platform.OS == 'ios'
														? -2
														: 0
											}}
											iconLeft
											buttonStyle={{
												backgroundColor: '#e3e1e1',
												borderRadius: 5,
												height:
													parseFloat(
														outParams.ShippingAmountOut
													) > 0
														? 42
														: 35,
												marginLeft: 5,
												width: 168,
												marginRight: 35,
											}}
										/>
									</Col>
								) : null}
							</Col>
						</Grid>
						{route.params.item.Status !== '' ?
							<Text style={{
								alignSelf: 'flex-end',
								color: route.params.item.Status == 'Betaald' || route.params.item.Status == 'Afgehandeld' ? 'green' : 'red',
								fontWeight: 'bold',
								marginRight: 25,
								fontSize: 18,
								justifyContent: 'center',
								marginBottom: 10
							}}>
								{route.params.item.Status}
							</Text>
							: null}
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
