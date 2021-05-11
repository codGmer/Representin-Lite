/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Share,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	ImageBackground,
	FlatList,
	Alert,
	Dimensions,
	Platform,
	AppState
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from 'react-native-elements';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import RetryIcon from 'react-native-vector-icons/MaterialIcons';
import { Col, Grid } from 'react-native-easy-grid';
import SearchIcon from 'react-native-vector-icons/MaterialIcons';
import ErrorMessage from '../components/ErrorMessage';
import ApiFavorites from '../api/ApiFavorites';

import { SearchBar } from 'react-native-elements';

const keyExtractor = item => item.Id;

class SearchIconBackground extends React.Component {
	render() {
		return (
			<SearchIcon
				name="search"
				color={'white'}
				size={120}
				style={{
					position: 'absolute',
					opacity: 0.3,
					top: Dimensions.get('window').height / 2 - 70,
					left: Dimensions.get('window').width / 2 - 50,
					zIndex: 9
				}}
			/>
		);
	}
}
export default function SearchScreen({ navigation, route }) {
	const [dataSource, setDataSource] = useState([]);
	const [favorite, setFavorite] = useState([]);
	const [Loading, setLoading] = useState(true);
	const [isReady, setIsReady] = useState(false)
	const [userLocation, setUserLocation] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const [hasFailed, setHasFailed] = useState(false);
	const [isOffline, setIsOffline] = useState(false);
	const [search, setSearch] = useState('');
	const [searchLoading, setSearchLoading] = useState(false);
	const [placeHolderSuggestions, setPlaceHolderSuggestions] = useState([
		'Attractiepark',
		'Festival',
		'Zwembad',
		'Karting',
		'Ontbijt',
	]);
	const [pickedSuggestion, setPickedSuggestion] = useState('');
	const [typing, setTyping] = useState(false);
	const [typingTimeout, setTypingTimeout] = useState(0);

	function handleFirstConnectivityChange(status) {
		if (status.isConnected) {
			_onRefresh();
			setIsOffline(false);
		} else {
			setLoading(false)
			searchLoading(false);
			setIsOffline(true)
		}
	}

	useEffect(() => {
		if (!isReady) {
			NetInfo.fetch().then(state => {
				if (state.type === 'none') {
					setIsOffline(true);
					setSearchLoading(false)
				} else {
					setIsOffline(false);
				}
			});
			_getUserLocation();
			setPickedSuggestion(route.params.shopSearch
				? 'Zoek in shop'
				: route.params.winSearch ? 'Zoek in winacties' : 'Bijv. ' +
					placeHolderSuggestions[
					Math.floor(
						Math.random() *
						placeHolderSuggestions.length
					)
					])
			setIsReady(true)
		}
		AppState.addEventListener('change', _handleAppStateChange);

		let unsubscribe = NetInfo.addEventListener(
			handleFirstConnectivityChange
		);

		return function cleanup() {
			unsubscribe();
			AppState.removeEventListener('change', _handleAppStateChange);
		};

		function _handleAppStateChange(nextAppState) {
			if (nextAppState == 'active') {
				_onRefresh(true);
			}
		}
	}, [])

	async function _retryGettingLocation() {
		await Location.getLastKnownPositionAsync().then(
			async value => {
				if (value == '') {
					Alert.alert(
						'Fout',
						'We konden geen locatie ophalen, controleer je locatie instellingen en probeer het opnieuw.',
						[
							{
								text: 'OK'
							}
						],
						{ cancelable: false }
					);
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
					);
				} else {
					await AsyncStorage.setItem(
						'userLocation',
						JSON.stringify(value)
					);
					setLoading(false)
				}
			},
			() => {
				Alert.alert(
					'Fout',
					'We konden geen locatie ophalen, controleer je locatie instellingen en probeer het opnieuw.',
					[
						{
							text: 'OK'
						}
					],
					{ cancelable: false }
				);
			}
		);
	}

	function _getUserLocation() {
		AsyncStorage.getItem('userLocation').then(
			data => {
				let userLocation = JSON.parse(data);
				if (
					userLocation !== '' &&
					typeof userLocation !== 'undefined' &&
					userLocation !== null
				) {
					setUserLocation(userLocation)
					_getFavoriteListDB();
				} else {
					if (Platform.OS !== 'ios') {
						_retryGettingLocation();
						_getFavoriteListDB();
					} else {
						_getFavoriteListDB();
					}
				}
			},
			() => _retryGettingLocation()
		);
	}

	async function _getFavoriteListDB() {
		let favoriteList = await ApiFavorites._getAllFavorites();
		if (favoriteList !== '0') {
			if (favoriteList) {
				setFavorite(favoriteList);
				setLoading(false)
			}
		} else {
			console.log('niks')
			setFavorite([''])
		}
	}

	function _searchFilterFunction(searchInput) {
		if (route.params.shopSearch) {
			// eslint-disable-next-line no-undef
			fetch('https://representin.nl/newapp/functions/index.php', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'https://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				},
				body: JSON.stringify({
					action: 'getShopSearchResults',
					searchInput: searchInput
				})
			})
				.then(response => response.json())
				.then(responseJson => {
					if (responseJson !== null && responseJson !== 'leeg') {
						_calculateDistance(responseJson);
						setIsOffline(false)
						setLoading(false)
						setRefreshing(false)
						setSearchLoading(false)
					} else {
						setDataSource('leeg')
						setIsOffline(false)
						setLoading(false)
						setRefreshing(false)
						setSearchLoading(false)
					}
				})
				.catch(error => {
					//console.log(error);
					setLoading(false)
					setSearchLoading(false)
				});
		} else if (route.params.winSearch) {
			// eslint-disable-next-line no-undef
			fetch('https://representin.nl/newapp/functions/index.php', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'https://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				},
				body: JSON.stringify({
					action: 'getWinSearchResults',
					searchInput: searchInput
				})
			})
				.then(response => response.json())
				.then(responseJson => {
					if (responseJson !== null) {
						_calculateDistance(responseJson);
						setLoading(false)
						setRefreshing(false)
						setSearchLoading(false)
						setIsOffline(false)
					}
				})
				.catch(error => {
					console.log(error);
					setLoading(false)
					setSearchLoading(false)
					setIsOffline(true)
				});
		} else {
			// eslint-disable-next-line no-undef
			fetch('https://representin.nl/newapp/functions/index.php', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json;charset=utf-8',
					'Access-Control-Allow-Origin': 'https://representin.nl/',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Max-Age': '3600',
					'Access-Control-Allow-Headers':
						'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
				},
				body: JSON.stringify({
					action: 'getSearchResults',
					searchInput: searchInput
				})
			})
				.then(response => response.json())
				.then(responseJson => {
					if (responseJson !== null) {
						_calculateDistance(responseJson);
						setLoading(false)
						setRefreshing(false)
						setSearchLoading(false)
						setIsOffline(false)
					}
				})
				.catch(error => {
					console.log(error);
					setLoading(false)
					setRefreshing(false)
					setSearchLoading(false)
					setIsOffline(true)
				});
		}
	}

	function _calculateDistance(itemList) {
		for (let index = 0; index < Object.keys(itemList).length; index++) {
			if (userLocation.length !== 0) {
				let distance = _calculateDistanceTwoPoints(
					userLocation.coords.latitude,
					userLocation.coords.longitude,
					itemList[index].Lat,
					itemList[index].Lng
				);
				distance < 300 || distance == ''
					? (itemList[index].distance = distance)
					: (itemList[index].distance = '-');
			} else {
				itemList[index].distance = '-';
			}
		}
		setDataSource(itemList)
	}

	function _OnShare(item) {
		let removedSpaces = item.Titel.split(' ').join('-');
		Share.share({
			title: item.Titel,
			message:
				'Check ' +
				item.Titel +
				' in de Representin app: ' +
				'https://www.representin.nl/app/' +
				removedSpaces +
				'?Id=' +
				item.Id
		});
	}

	function _openDetails(Id, ItemID, Titel, Type) {
		if (ItemID) {
			if (Type == 'events') {
				navigation.navigate('EventsStack', {
					screen: 'Details',
					params: {
						Id: ItemID,
						Titel,
						Shop: route.params
							.shopSearch
					},
					initial: false
				})
			} else if (Type == 'activities') {
				navigation.navigate('Activities', {
					screen: 'ActivityDetails',
					params: {
						Id: ItemID,
						Titel,
						Shop: route.params
							.shopSearch
					},
					initial: false
				})
			} else {
				navigation.navigate('ProductDetails', {
					Id: ItemID,
					Titel,
					Shop: route.params
						.shopSearch
				})
			}
		} else {
			if (Type == 'events') {
				navigation.navigate('EventsStack', {
					screen: 'Details',
					params: {
						Id,
						Titel,
						Shop: false
					},
					initial: false
				})
			} else if (Type == 'activities') {
				navigation.navigate('Activities', {
					screen: 'ActivityDetails',
					params: {
						Id,
						Titel,
						Shop: route.params
							.shopSearch
					},
					initial: false
				});
			} else {
				navigation.navigate('ProductDetails', {
					Id,
					Titel,
					Shop: route.params
						.shopSearch
				});
			}
		}
	}

	function _onRefresh(backgroundFetch) {
		backgroundFetch ? '' : setRefreshing(true);
		_getUserLocation();
	}

	function _updateAdClick(adID) {
		// eslint-disable-next-line no-undef
		fetch('https://representin.nl/newapp/functions/index.php', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json;charset=utf-8',
				'Access-Control-Allow-Origin': 'https://representin.nl/',
				'Access-Control-Allow-Methods': 'POST',
				'Access-Control-Max-Age': '3600',
				'Access-Control-Allow-Headers':
					'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
			},
			body: JSON.stringify({
				action: 'updateAdClick',
				adID: adID
			})
		});
	}

	function renderShopItem({ item }) {
		let eventUri =
			'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
		let toDoUri =
			'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
		let activityUri =
			'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
		let productUri =
			'http://adminpanel.representin.nl/image.php?image=/sales/ProductFotos/'
		return (
			<TouchableOpacity
				id={item.Id}
				onPress={() => _openDetails(item.Id, item.ItemID, item.Titel, item.Type)}
				style={{
					flex: 1,
					flexDirection: 'row',
					marginBottom: 1,
					backgroundColor: 'black'
				}}
			>
				<ImageBackground
					style={{
						width: '100%',
						height: 180,
						alignItems: 'flex-end'
					}}
					imageStyle={{
						resizeMode: 'stretch'
					}}
					source={
						item.Type == 'events'
							? item.Soort !== '0'
								? {
									uri: eventUri + item.Foto
								}
								: {
									uri: toDoUri + item.Foto
								}
							: item.Type == 'products' ? { uri: productUri + item.Foto } : { uri: activityUri + item.Foto }
					}
				>
					<View
						style={{
							position: 'absolute',
							bottom: 0,
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%'
						}}
					>
						<LinearGradient
							colors={['rgba(0,0,0,0.9)', 'transparent']}
							start={{ x: 0, y: 1 }}
							end={{ x: 0, y: 0 }}
							style={{
								height: 80,
								width: '100%',
								paddingLeft: 10,
								paddingRight: 10,
								paddingBottom: 30
							}}
						>
							<Text
								style={{
									fontSize: 18,
									marginTop: item.PriceLabel ? 15 : 25,
									color: 'white',
									fontWeight: 'bold'
								}}
							>
								{item.Titel}
							</Text>
							<Text
								style={{
									fontSize: 11,
									color: 'white',
									marginBottom: -3
								}}
							>
								{item.PriceLabel}
							</Text>
							{item.OutOfStock > 0 || (item.OutOfStockProperties > 0 && item.InStockProperties == 0) ? (
								<View
									style={{
										flexDirection: 'row',
										marginTop: item.PriceLabel
											? Platform.OS === 'ios'
												? 5
												: 0
											: Platform.OS === 'ios'
												? -10
												: -15
									}}
								>
									<Text
										style={{
											color: 'red',
											fontSize: 18,
											textDecorationLine: 'line-through'
										}}
									>
										{'€ ' + item.MinPrice}
									</Text>
									<Text
										style={{
											color: 'red',
											fontSize: 18,
											fontWeight: 'bold',
											marginLeft: 5
										}}
									>
										{'Uitverkocht'}
									</Text>
								</View>
							) : item.Price == '' ||
								typeof item.MinPrice == 'undefined' ? null : (
								<View
									style={{
										height: 45,
										width: '100%',
										elevation: 5,
										marginTop: item.PriceLabel
											? Platform.OS === 'ios'
												? -8
												: -10
											: Platform.OS === 'ios'
												? -20
												: -25
									}}
								>
									<Grid>
										{item.OldPrice ? (
											<Col
												style={{
													width: 'auto'
												}}
											>
												<Text
													style={{
														color: 'grey',
														marginTop: 12,
														fontSize: 18,
														textDecorationLine:
															'line-through',
														width: 'auto'
													}}
												>
													{parseFloat(item.OldPrice) %
														1
														? '€ ' +
														parseFloat(
															item.OldPrice
														).toFixed(2)
														: '€ ' +
														parseFloat(
															item.OldPrice
														)}
												</Text>
											</Col>
										) : null}
										<Col
											style={{
												marginLeft: item.OldPrice
													? 5
													: 0
											}}
										>
											<Text
												style={{
													color: 'white',
													marginTop: 8,
													fontSize: 23,
													fontWeight: 'bold'
												}}
											>
												{parseFloat(item.MinPrice) % 1 || parseFloat(item.MaxPrice) % 1
													? parseFloat(item.MinPrice) == parseFloat(item.MaxPrice) ? '€ ' +
														parseFloat(
															item.MinPrice
														).toFixed(2) : '€ ' +
														parseFloat(
															item.MinPrice
														).toFixed(2) + ' - € ' + parseFloat(item.MaxPrice).toFixed(2)
													: parseFloat(item.MinPrice) == parseFloat(item.MaxPrice) ? '€ ' +
														parseFloat(
															item.MinPrice
														) : '€ ' +
														parseFloat(
															item.MinPrice
														) + ' - € ' + parseFloat(item.MaxPrice)}
											</Text>
										</Col>
									</Grid>
								</View>
							)}
						</LinearGradient>
					</View>
				</ImageBackground>
			</TouchableOpacity>
		);
	}

	function renderItem({ item }) {
		//advertisement
		let adUri =
			'http://adminpanel.representin.nl/image.php?image=/advertenties/images/';
		if (item.Type == 'ad') {
			return (
				<TouchableOpacity
					id={item.Id}
					onPress={() => {
						_updateAdClick(item.Id);
						WebBrowser.openBrowserAsync(item.Url);
					}}
					activeOpacity={0.9}
					style={{
						flex: 1,
						flexDirection: 'row',
						marginBottom: 1,
						backgroundColor: 'black',
						underlayColor: 'black'
					}}
				>
					<ImageBackground
						style={{
							width: '100%',
							height: 180,
							alignItems: 'flex-end'
						}}
						imageStyle={{
							resizeMode: 'stretch'
						}}
						source={{ uri: adUri + item.Foto }}
					>
						{item.Uitlichten > 0 ? (
							<Text
								style={{
									fontSize: 14,
									color: 'black',
									fontWeight: 'bold',
									marginTop: 10,
									backgroundColor: 'rgb(255,186,0)',
									width: 'auto',
									left: 10,
									position: 'absolute',
									padding: 2,
									shadowColor: '#000',
									shadowOffset: {
										width: 0,
										height: 5
									},
									shadowOpacity: 0.34,
									shadowRadius: 6.27,

									elevation: 15
								}}
							>
								{'Aanbevolen'}
							</Text>
						) : null}
					</ImageBackground>
				</TouchableOpacity>
			);
		} else {
			//event or activity
			let eventUri =
				'http://adminpanel.representin.nl/image.php?image=/events/Fotos/';
			let activityUri =
				'http://adminpanel.representin.nl/image.php?image=/activiteiten/Fotos/';
			let partyUri =
				'http://adminpanel.representin.nl/image.php?image=/uitgaan/Fotos/';
			return (
				<TouchableOpacity
					id={item.Id}
					onPress={() => _openDetails(item.Id, item.ItemID, item.Titel, item.Type)}
					activeOpacity={0.9}
					style={{
						flex: 1,
						flexDirection: 'row',
						marginBottom: 1,
						backgroundColor: 'black',
						underlayColor: 'black'
					}}
				>
					<ImageBackground
						style={{
							width: '100%',
							height: 180,
							alignItems: 'flex-end'
						}}
						imageStyle={{
							resizeMode: 'stretch'
						}}
						source={
							item.Soort !== '0'
								? item.Type == 'events' || item.Soort == '1'
									? {
										uri: eventUri + item.Foto
									}
									: {
										uri: activityUri + item.Foto
									}
								: {
									uri: partyUri + item.Foto
								}
						}
					>
						{item.Uitlichten > 0 && item.Geannuleerd !== 0 ? (
							<Text
								style={{
									fontSize: 14,
									color: 'black',
									fontWeight: 'bold',
									marginTop: 10,
									backgroundColor: 'rgb(255,186,0)',
									width: 'auto',
									left: 10,
									position: 'absolute',
									padding: 2,
									shadowColor: '#000',
									shadowOffset: {
										width: 0,
										height: 5
									},
									shadowOpacity: 0.34,
									shadowRadius: 6.27,

									elevation: 15
								}}
							>
								{'Aanbevolen'}
							</Text>
						) : null}
						{item.Geannuleerd == 1 ? (
							<Text
								style={{
									fontSize: 16,
									color: 'white',
									fontWeight: 'bold',
									marginTop: 10,
									backgroundColor: 'red',
									width: 'auto',
									left: 10,
									position: 'absolute',
									padding: 2,
									shadowColor: '#000',
									shadowOffset: {
										width: 0,
										height: 5
									},
									shadowOpacity: 0.34,
									shadowRadius: 6.27,

									elevation: 15
								}}
							>
								{'Geannuleerd'}
							</Text>
						) : null}
						<View
							style={{
								position: 'absolute',
								bottom: 0,
								justifyContent: 'center',
								alignItems: 'center',
								width: '100%'
							}}
						>
							<LinearGradient
								colors={['rgba(0,0,0,0.9)', 'transparent']}
								start={{ x: 0, y: 1 }}
								end={{ x: 0, y: 0 }}
								style={{
									height: 80,
									width: '100%',
									paddingLeft: 10,
									paddingRight: 10,
									paddingBottom:
										item.Locatie !== '' ||
											item.Plaatsnaam !== ''
											? Dimensions.get('window').width <
												340
												? 0
												: 30
											: 30
								}}
							>
								{item.Geenadres !== '1' ? (
									<Text
										style={{
											fontSize: 12,
											color: 'white',
											fontWeight: 'bold',
											marginTop: 12,
											backgroundColor: 'black',
											width: 'auto',
											left: 10,
											position: 'absolute',
											paddingRight: 2,
											paddingLeft: 2,
											shadowColor: '#000',
											shadowOffset: {
												width: 0,
												height: 5
											},
											shadowOpacity: 0.34,
											shadowRadius: 6.27,

											elevation: 15
										}}
									>
										{item.distance + ' KM'}
									</Text>
								) : null}
								<Text
									style={{
										fontSize:
											item.Titel.length > 33 ? 18 : 20,
										marginTop: 28,
										height: 25,
										color: 'white',
										fontWeight: 'bold',
										textShadowColor: 'rgba(0, 0, 0, 0.4)',
										textShadowOffset: {
											width: -1,
											height: 1
										},
										textShadowRadius: 10,
										elevation: 22
									}}
								>
									{item.Titel}
								</Text>

								<Text
									style={{
										fontSize: 14,
										color: 'white',
										textShadowColor: 'rgba(0, 0, 0, 0.4)',
										textShadowOffset: {
											width: -1,
											height: 1
										},
										textShadowRadius: 10,
										elevation: 22
									}}
								>
									{item.Type == 'events'
										? item.Geenadres !== '1'
											? item.Locatie !== '' ||
												item.Plaatsnaam !== ''
												? item.Regio == '' &&
													item.Locatie == '' &&
													item.Plaatsnaam == ''
													? item.Datum_Begin +
													' om ' +
													item.BeginTime
													: item.Regio !== ''
														? item.Datum_Begin +
														' om ' +
														item.BeginTime +
														' | ' +
														item.Locatie +
														item.Plaatsnaam +
														', ' +
														item.Regio
														: item.Datum_Begin +
														' om ' +
														item.BeginTime +
														' | ' +
														item.Locatie +
														item.Plaatsnaam
												: ''
											: item.Datum_Begin +
											' om ' +
											item.BeginTime
										: item.omschrijvingsVeld !== '' &&
											(item.Locatie !== '' ||
												item.Plaatsnaam !== '')
											? item.omschrijvingsVeld +
											' | ' +
											item.Locatie +
											item.Plaatsnaam
											: item.omschrijvingsVeld == ''
												? item.Locatie + item.Plaatsnaam
												: item.omschrijvingsVeld}
								</Text>
							</LinearGradient>
						</View>
						<View style={{ flexDirection: 'row', paddingTop: 5 }}>
							<TouchableOpacity
								style={{
									paddingRight: 3,
									paddingTop: 5,
									paddingBottom: 3,
									paddingLeft: 3,
									width: 30
								}}
							>
								<Icon
									name={
										isFavorite(item)
											? 'favorite'
											: 'favorite-border'
									}
									size={25}
									color="white"
									onPress={() => toggleFav(item)}
									underlayColor={'rgba(255, 255, 255, 0)'}
									iconStyle={{
										textShadowColor: 'rgba(0, 0, 0, 0.4)',
										textShadowOffset: {
											width: 0,
											height: 1
										},
										textShadowRadius: 0.5
									}}
									style={{
										marginRight: 15,
										width: '100%'
									}}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									paddingRight: 3,
									paddingTop: 5,
									paddingBottom: 3,
									width: 30
								}}
							>
								<Icon2
									name={'share'}
									size={25}
									color="white"
									onPress={() => _OnShare(item)}
									underlayColor={'rgba(255, 255, 255, 0)'}
									style={{
										textShadowColor: 'rgba(0, 0, 0, 0.4)',
										textShadowRadius: 0.5,
										textShadowOffset: {
											width: 0,
											height: 1
										}
									}}
								/>
							</TouchableOpacity>
						</View>
					</ImageBackground>
				</TouchableOpacity>
			);
		}
	}

	function _calculateDistanceTwoPoints(uLat, uLng, fLat, fLng) {
		//uLat = user latitude
		//fLat = popular latitude

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
				style={{ height: 1, width: '100%', backgroundColor: 'white' }}
			/>
		);
	}

	function toggleFav(item) {
		if (!isOffline && !hasFailed) {
			_updateFavoriteDB(item);
		} else {
			Alert.alert(
				'Offline',
				'Je bent momenteel offline, controleer je internet en probeer het opnieuw'
			);
		}
	}

	async function _updateFavoriteDB(item) {
		const id = keyExtractor(item);
		let response = await ApiFavorites._updateFavorite(id);
		if (response === '1') {
			_getFavoriteListDB();
		}
	}

	function isFavorite(item) {
		const id = keyExtractor(item);
		return favorite.includes(parseInt(id));
	}

	if (Loading) {
		return (
			<View style={[styles.horizontal, styles.container]}>
				<ActivityIndicator size="large" color="white" />
				{search == '' ? <SearchIconBackground /> : null}
			</View>
		);
	} else {
		if (isOffline) {
			return (
				<View
					style={{
						height: '100%',
						width: '100%',
						backgroundColor: 'black'
					}}
				>
					<View style={styles.header}>
						<TouchableOpacity
							onPress={() => {
								navigation.goBack();
								return true;
							}}
							style={{ marginTop: 20 }}
						>
							{Platform.OS === 'ios' ?
								<Icon
									name="chevron-left"
									color="white"
									type='feather'
									size={35}
									containerStyle={{
										marginLeft: 15,
										marginRight: 15
									}}
									style={{ marginTop: 4 }}
								/>
								:
								<Icon
									name="arrow-back"
									color="white"
									underlayColor={'rgba(255, 255, 255, 0)'}
									containerStyle={{
										marginLeft: 15,
										marginRight: 15
									}}
								/>
							}
						</TouchableOpacity>
						<SearchBar
							placeholder={
								pickedSuggestion + '...'
							}
							onChangeText={inputText => {
								if (inputText == '') {
									setSearchLoading(false),
										setDataSource(''),
										setSearch('')
									clearTimeout(typingTimeout);
								} else {
									setSearchLoading(true)
									if (typingTimeout) {
										clearTimeout(
											typingTimeout
										);
									}
									setTyping(false)
									setTypingTimeout(setTimeout(() => {
										_searchFilterFunction(
											inputText
										);
									}, 400))
									setSearch(inputText)
								}
							}}
							searchIcon={{ color: 'black' }}
							cancelIcon={{ color: 'black' }}
							clearIcon={{ color: 'white' }}
							inputStyle={{
								color: '#fff',
								marginLeft: -15,
								fontSize: 19
							}}
							autoFocus={true}
							underlineColorAndroid="black"
							placeholderTextColor="#C7C7CD"
							showLoading={
								searchLoading ? true : false
							}
							cancelButtonTitle=""
							platform={
								Platform.OS === 'ios'
									? 'android'
									: 'android'
							}
							containerStyle={{
								width:
									Dimensions.get('window').width < 350
										? 260
										: 300,
								alignSelf: 'stretch',
								backgroundColor: 'transparent'
							}}
							value={search}
						/>
					</View>
					<ErrorMessage retryMessage={false} />
				</View>
			);
		} else if (hasFailed) {
			return (
				<View
					style={{
						justifyContent: 'center',
						alignSelf: 'center'
					}}
				>
					<TouchableOpacity
						style={{ alignSelf: 'center' }}
						onPress={_onRefresh}
					>
						<RetryIcon name="refresh" size={30} />
					</TouchableOpacity>
					<Text style={{ color: 'red' }}>
						{
							'Er ging iets mis, probeer het opnieuw met deze knop.'
						}
					</Text>
					{search == '' ? (
						<SearchIconBackground />
					) : null}
				</View>
			);
		} else {
			return (
				<View
					style={{
						height: '100%',
						width: '100%',
						backgroundColor: 'black'
					}}
				>
					<View style={styles.header}>
						<TouchableOpacity
							onPress={() => {
								navigation.goBack();
								return true;
							}}
							style={{ marginTop: 15 }}
						>
							{Platform.OS === 'ios' ?
								<Icon
									name="chevron-left"
									color="white"
									type='feather'
									size={35}
									containerStyle={{
										marginRight: 30
									}}
								/>
								:
								<Icon
									name="arrow-back"
									color="white"
									underlayColor={'rgba(255, 255, 255, 0)'}
									containerStyle={{
										marginLeft: 15,
										marginRight: 15
									}}
									style={{ marginTop: 5 }}
								/>
							}
						</TouchableOpacity>
						<SearchBar
							placeholder={
								pickedSuggestion + '...'
							}
							onChangeText={inputText => {
								if (inputText == '') {
									setSearchLoading(false)
									setDataSource('')
									setSearch('')
									clearTimeout(typingTimeout);
								} else {
									setSearchLoading(true)
									if (typingTimeout) {
										clearTimeout(
											typingTimeout
										);
									}

									setTyping(false),
										setTypingTimeout(setTimeout(() => {
											_searchFilterFunction(
												inputText
											);
										}, 400))
									setSearch(inputText)
								}
							}}
							searchIcon={{ color: 'transparent' }}
							cancelIcon={{ color: 'transparent' }}
							clearIcon={{ color: 'transparent' }}
							inputStyle={{
								color: '#fff',
								marginLeft: -15,
								fontSize: 19
							}}
							autoFocus={true}
							underlineColorAndroid="black"
							placeholderTextColor="#C7C7CD"
							showLoading={
								searchLoading ? true : false
							}
							cancelButtonTitle=""
							platform={
								Platform.OS === 'ios'
									? 'android'
									: 'android'
							}
							containerStyle={{
								width:
									Dimensions.get('window').width < 350
										? 260
										: 300,
								alignSelf: 'stretch',
								backgroundColor: 'transparent'
							}}
							value={search}
						/>
					</View>
					{dataSource == 'leeg' ? (
						<Text
							key={1}
							fontSize={30}
							style={{
								alignContent: 'center',
								textAlign: 'center',
								marginTop: 10,
								color: 'white'
							}}
						>
							Geen resultaten gevonden
						</Text>
					) : null}
					{dataSource !== 'leeg' ? (
						<View style={styles.container}>
							<FlatList
								data={dataSource}
								renderItem={
									route.params
										.shopSearch
										? renderShopItem
										: renderItem
								}
								keyExtractor={(item, index) => item.Id}
								ItemSeparatorComponent={
									renderSeperator
								}
								initialNumToRender={5}
								windowSize={15}
								keyboardShouldPersistTaps="always"
								extraData={favorite}
							/>
						</View>
					) : null}
					{search == '' ? (
						<SearchIconBackground />
					) : null}
				</View>
			);
		}
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
		justifyContent: 'center'
	},
	horizontal: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 10,
		marginTop: Constants.statusBarHeight
	},
	header: {
		backgroundColor: 'black',
		width: '100%',
		height: 56,
		flexDirection: 'row'
	},
	headerLogo: {
		height: 50,
		width: 50
	}
});
